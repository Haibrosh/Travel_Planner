"use client";

import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      Đang tải bản đồ...
    </div>
  ),
});

export default function TripMapLoader() {
  return <TripMap />;
}