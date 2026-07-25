"use client";

import { useState, useEffect } from "react";
import { SupplyNode, SupplyArc, NodeType, NodeStatus } from "@/types/supplyChainGlobe";

// ─── Map digital-twin node types → globe node types ──────────────────────────

const TWIN_TYPE_MAP: Record<string, NodeType> = {
  suppliernode: "supplier",
  supplier: "supplier",
  factorynode: "manufacturer",
  factory: "manufacturer",
  manufacturer: "manufacturer",
  warehousenode: "warehouse",
  warehouse: "warehouse",
  distributionnode: "warehouse",
  distribution: "warehouse",
  portnode: "port",
  port: "port",
  retailernode: "retailer",
  retailer: "retailer",
  "supply-chain-node": "warehouse",
  supplychainnode: "warehouse",
};

function mapNodeType(raw: string | null | undefined): NodeType {
  if (!raw) return "warehouse";
  return TWIN_TYPE_MAP[raw.toLowerCase().replace(/[\s\-_]/g, "")] ?? "warehouse";
}

function mapRiskToStatus(riskLevel: number | string | null | undefined): NodeStatus {
  const n = typeof riskLevel === "string" ? parseFloat(riskLevel) : riskLevel;
  if (n == null || isNaN(n)) return "active";
  if (n >= 8) return "critical";
  if (n >= 5) return "delayed";
  return "active";
}

// ─── Extract nodes from localStorage canvas data ─────────────────────────────

function extractFromLocalStorage(twinId: string): { nodes: SupplyNode[]; arcs: SupplyArc[] } | null {
  try {
    const raw = localStorage.getItem(`supplyChain-${twinId}`);
    if (!raw) return null;

    const twinData = JSON.parse(raw);
    const canvasNodes: any[] = twinData.nodes ?? [];
    const canvasEdges: any[] = twinData.edges ?? [];

    // Only keep canvas nodes that have lat/lng coordinates
    const nodeMap = new Map<string, SupplyNode>();

    for (const cn of canvasNodes) {
      const d = cn.data ?? {};
      // Accept coordinates from multiple possible field names
      // Templates store coords as data.location.lat/lng; direct fields also supported
      const loc = d.location ?? {};
      const lat = d.lat ?? loc.lat ?? d.location_lat ?? d.latitude ?? null;
      const lng = d.lng ?? loc.lng ?? d.location_lng ?? d.longitude ?? null;

      if (lat == null || lng == null) continue;

      const nodeType = mapNodeType(d.nodeType ?? d.type ?? cn.type);
      // Templates use riskScore (0-1 float), DB uses risk_level (1-10)
      const rawRisk = d.riskLevel ?? d.risk_level ?? (d.riskScore != null ? d.riskScore * 10 : null);
      const status = mapRiskToStatus(rawRisk);

      const node: SupplyNode = {
        id: cn.id,
        name: d.label ?? d.name ?? "Unnamed Node",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        type: nodeType,
        status,
        country: d.country ?? loc.country ?? "",
        city: d.city ?? d.address ?? loc.address ?? d.location_city ?? "",
      };
      nodeMap.set(cn.id, node);
    }

    const nodes = Array.from(nodeMap.values());

    // Build arcs from canvas edges where both endpoints have coordinates
    const arcs: SupplyArc[] = [];
    for (const edge of canvasEdges) {
      const from = nodeMap.get(edge.source);
      const to = nodeMap.get(edge.target);
      if (!from || !to) continue;

      arcs.push({
        id: edge.id,
        fromNodeId: from.id,
        toNodeId: to.id,
        startLat: from.lat,
        startLng: from.lng,
        endLat: to.lat,
        endLng: to.lng,
        label: edge.label ?? edge.data?.label,
        status:
          from.status === "critical" || to.status === "critical"
            ? "critical"
            : from.status === "delayed" || to.status === "delayed"
            ? "delayed"
            : "active",
      });
    }

    if (nodes.length === 0) return null; // no geo data, fall through
    return { nodes, arcs };
  } catch {
    return null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseSupplyChainGlobeResult {
  nodes: SupplyNode[];
  arcs: SupplyArc[];
  loading: boolean;
  error: string | null;
  usingMockData: boolean;
}

export function useSupplyChainGlobe(twinId?: string | null): UseSupplyChainGlobeResult {
  const [nodes, setNodes] = useState<SupplyNode[]>([]);
  const [arcs, setArcs] = useState<SupplyArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      // ── Strategy 1: Read canvas nodes from localStorage ────────────────
      if (twinId) {
        const localResult = extractFromLocalStorage(twinId);
        if (localResult && localResult.nodes.length > 0) {
          if (!cancelled) {
            setNodes(localResult.nodes);
            setArcs(localResult.arcs);
            setUsingMockData(false);
            setLoading(false);
          }
          return;
        }
      }

      // ── Strategy 2: Pull directly from the digital twin DB tables ──────
      if (twinId) {
        try {
          const res = await fetch(`/api/supply-chain/twin-globe?twinId=${twinId}`);
          if (res.ok) {
            const payload = await res.json();
            if (!cancelled && payload.nodes?.length > 0) {
              setNodes(payload.nodes);
              setArcs(payload.arcs ?? []);
              setUsingMockData(false);
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall through to legacy API
        }
      }

      // ── Strategy 3: Legacy supply_globe_nodes / supply_globe_arcs API ──
      try {
        const params = twinId ? `?twinId=${twinId}` : "";
        const [nodesRes, arcsRes] = await Promise.all([
          fetch(`/api/supply-chain/nodes${params}`),
          fetch(`/api/supply-chain/arcs${params}`),
        ]);

        if (!nodesRes.ok || !arcsRes.ok) throw new Error("API error");

        const [fetchedNodes, fetchedArcs]: [SupplyNode[], SupplyArc[]] =
          await Promise.all([nodesRes.json(), arcsRes.json()]);

        if (cancelled) return;

        if (fetchedNodes.length > 0) {
          setNodes(fetchedNodes);
          setArcs(fetchedArcs);
          setUsingMockData(false);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to mock
      }

      // ── No geographic data for this twin ───────────────────────────────
      // Show an empty map rather than fabricated sample nodes, so the Map view
      // is always true to the actual digital twin.
      if (!cancelled) {
        setNodes([]);
        setArcs([]);
        setUsingMockData(false);
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [twinId]);

  return { nodes, arcs, loading, error, usingMockData };
}

export { mapNodeType };
