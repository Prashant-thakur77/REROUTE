import { NextRequest, NextResponse } from 'next/server';
import { rerouteAroundNode, type RawNode, type RawEdge, type Reroute } from '@/lib/routing';

// Deterministic route optimization. Computes real alternate paths around a
// disrupted node (weighted Dijkstra) instead of asking an LLM to traverse the
// graph — correct, instant, and quota-free. Response shape is unchanged so the
// Control Tower panel keeps working.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodeId, description, nodes, edges } = body;

    if (!nodeId || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json({ error: 'nodeId, nodes and edges are required' }, { status: 400 });
    }

    const disruptedNode = nodes.find((n: any) => n.id === nodeId);
    const nodeName = disruptedNode?.data?.label || nodeId;

    const rNodes: RawNode[] = nodes.map((n: any) => ({ id: n.id, label: n.data?.label ?? n.id }));
    const rEdges: RawEdge[] = edges.map((e: any) => ({
      source: e.source,
      target: e.target,
      cost: e.data?.cost,
      time: e.data?.transitTime ?? e.data?.transit_time,
    }));

    // Flag nodes with elevated risk so alternate routes can warn about them.
    const riskById = new Map<string, boolean>();
    for (const n of nodes as any[]) {
      const d = n.data || {};
      const elevated =
        (Number(d.riskScore) || 0) >= 0.7 ||
        String(d.riskLevel ?? '').toLowerCase() === 'high' ||
        !!d.hasPreKnownRisks;
      riskById.set(n.id, elevated);
    }

    const result = rerouteAroundNode(rNodes, rEdges, nodeId);

    const routeStr = (r: Reroute): string => {
      const alt = r.alternate;
      if (!alt) return `${r.fromLabel} → ${r.toLabel}: no bypass route available`;
      const labeled = alt.path
        .map((id, i) => (riskById.get(id) ? `${alt.labels[i]} (elevated risk)` : alt.labels[i]))
        .join(' → ');
      const extra: string[] = [];
      if (r.addedCost != null && r.addedCost !== 0) extra.push(`${r.addedCost > 0 ? '+' : ''}$${Math.round(r.addedCost)}`);
      if (r.addedTime != null && r.addedTime !== 0) extra.push(`${r.addedTime > 0 ? '+' : ''}${Math.round(r.addedTime)}d`);
      return `${labeled}${extra.length ? ` (${extra.join(', ')})` : ''}`;
    };

    const total = result.reroutes.length;
    const alternateRoutes =
      total === 0 ? [`No modeled routes pass through ${nodeName}.`] : result.reroutes.slice(0, 5).map(routeStr);

    const impactDescription =
      total === 0
        ? `No modeled routes pass through ${nodeName}, so this disruption has no direct routing impact on the network.${description ? ` Context: ${description}` : ''}`
        : `Disruption at ${nodeName} affects ${total} route segment${total === 1 ? '' : 's'}. ` +
          `${result.feasibleCount} can be rerouted around it` +
          (result.infeasibleCount > 0 ? `, but ${result.infeasibleCount} have no viable bypass in the current network.` : '.');

    return NextResponse.json({ severity: result.severity, impactDescription, alternateRoutes });
  } catch (error: any) {
    console.error('Error in route-optimization:', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to process route optimization' }, { status: 500 });
  }
}
