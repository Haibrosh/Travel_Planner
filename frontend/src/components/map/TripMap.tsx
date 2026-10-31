"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useItineraryStore, useSelectedDayItems } from "@/store/useItineraryStore";
import { getCategoryLabel } from "@/utils/placeCategory";

const DEFAULT_CENTER: L.LatLngTuple = [10.346, 107.084]; // Vũng Tàu
const DEFAULT_ZOOM = 13;

// Viết trọn class Tailwind trong chuỗi để Tailwind v4 quét được
const MARKER_BASE =
  "flex h-full w-full items-center justify-center rounded-full border-2 border-white text-xs font-extrabold text-white shadow-lg";
const MARKER_NORMAL = `${MARKER_BASE} bg-teal-600`;
const MARKER_SELECTED = `${MARKER_BASE} bg-[#0F766E] ring-4 ring-teal-300/60`;

// Cache icon để không tạo lại instance mới mỗi lần render
const iconCache = new Map<string, L.DivIcon>();

// Marker tròn đánh số; marker đang chọn to hơn và có viền ngoài
function getNumberedIcon(order: number, isSelected: boolean): L.DivIcon {
  const cacheKey = `${order}-${isSelected}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const size = isSelected ? 36 : 30;
  const icon = L.divIcon({
    className: "", // bỏ style mặc định của divIcon
    html: `<div class="${isSelected ? MARKER_SELECTED : MARKER_NORMAL}">${order}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  iconCache.set(cacheKey, icon);
  return icon;
}

// Tự căn khung khi đổi ngày / thêm / xóa địa điểm (đổi thứ tự thì không căn lại)
function FitBoundsController() {
  const map = useMap();
  const dayKey = useItineraryStore((s) => s.selectedDayKey);
  const items = useSelectedDayItems();
  const lastFitKey = useRef<string | null>(null);

  useEffect(() => {
    const ids = items.map((i) => i.place.id).sort().join(",");
    const fitKey = `${dayKey ?? ""}|${ids}`;
    if (lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;

    if (items.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    } else if (items.length === 1) {
      map.setView([items[0].place.lat, items[0].place.lng], 15);
    } else {
      const points: L.LatLngTuple[] = items.map((i) => [i.place.lat, i.place.lng]);
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
    }
  }, [items, dayKey, map]);

  return null;
}

// Chọn thẻ trong timeline -> dịch bản đồ tới marker nếu nó sát mép / ngoài khung nhìn
function PanToSelected() {
  const map = useMap();
  const selectedPlaceId = useItineraryStore((s) => s.selectedPlaceId);
  const items = useSelectedDayItems();
  const lastPannedId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedPlaceId == null) {
      lastPannedId.current = null;
      return;
    }
    if (lastPannedId.current === selectedPlaceId) return;

    const target = items.find((i) => i.place.id === selectedPlaceId);
    if (!target) return;
    lastPannedId.current = selectedPlaceId;

    const latLng = L.latLng(target.place.lat, target.place.lng);
    if (!map.getBounds().pad(-0.1).contains(latLng)) {
      map.panTo(latLng);
    }
  }, [selectedPlaceId, items, map]);

  return null;
}

export default function TripMap() {
  const selectedPlaceId = useItineraryStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = useItineraryStore((s) => s.setSelectedPlaceId);
  const items = useSelectedDayItems();

  const routePositions: L.LatLngTuple[] = items.map((i) => [i.place.lat, i.place.lng]);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBoundsController />
      <PanToSelected />

      {/* Đường nối các điểm theo thứ tự trong ngày */}
      {routePositions.length >= 2 && (
        <Polyline
          positions={routePositions}
          pathOptions={{ color: "#14b8a6", weight: 3, opacity: 0.8, dashArray: "6 8" }}
        />
      )}

      {items.map((item, index) => {
        const { place } = item;
        const isSelected = selectedPlaceId === place.id;
        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={getNumberedIcon(index + 1, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: () => setSelectedPlaceId(place.id) }}
          >
            {/* Dùng div thay vì p vì leaflet.css đặt margin lớn cho p trong popup */}
            <Popup>
              <div className="text-xs">
                <div className="font-semibold text-slate-900">{place.name}</div>
                <div className="text-slate-500">{getCategoryLabel(place.category)}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}