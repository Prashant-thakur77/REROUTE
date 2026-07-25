"use client";

import dynamic from "next/dynamic";

const SupplyChainMap = dynamic(() => import("./SupplyChainMap"), { ssr: false });

interface SupplyChainViewProps {
  twinId?: string | null;
  // Retained for call-site compatibility; only the 2D map view remains.
  mode?: "graph" | "map";
}

export default function SupplyChainView({ twinId }: SupplyChainViewProps) {
  return <SupplyChainMap twinId={twinId} />;
}
