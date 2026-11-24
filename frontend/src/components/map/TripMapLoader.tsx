"use client";

import dynamic from "next/dynamic";
import type { Place } from "@/types/place";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      Đang tải bản đồ...
    </div>
  ),
});

interface TripMapLoaderProps {
  places?: Place[];
  dayKey?: string; // đổi ngày thì map fitBounds lại
  dayColor?: string; // màu marker + đường nối của ngày
}

export default function TripMapLoader({ places, dayKey, dayColor }: TripMapLoaderProps) {
  return <TripMap places={places} dayKey={dayKey} dayColor={dayColor} />;
}
