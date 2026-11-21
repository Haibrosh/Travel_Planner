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
  dayNumber?: number;
}

export default function TripMapLoader({ places, dayNumber }: TripMapLoaderProps) {
  return <TripMap places={places} dayNumber={dayNumber} />;
}