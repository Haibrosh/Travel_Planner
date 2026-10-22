"use client";
import { useMapStore } from "@/store/useMapStore";

export default function SelectedDebug() {
  const id = useMapStore((s) => s.selectedPlaceId);
  return <p className="mb-2 text-sm">selectedPlaceId: {String(id)}</p>;
}