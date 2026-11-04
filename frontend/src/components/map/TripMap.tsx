"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, type RefObject } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Place } from "@/types/place";
import { useMapStore } from "@/store/useMapStore";
import { useMapHoverStore } from "@/store/useMapHoverStore";

type MarkerState = "default" | "hover" | "selected";

// Style marker theo Figma: teal, chọn thì đậm hơn và phóng to
const MARKER_STYLES: Record<MarkerState, string> = {
  default: "bg-teal-600",
  hover: "bg-teal-600 scale-125",
  selected: "bg-[#0F766E] ring-4 ring-teal-300/60 scale-125",
};

const iconCache = new Map<string, L.DivIcon>();

// Icon hiển thị số thứ tự; cache theo (số, trạng thái) để không tạo icon mới mỗi lần render
function getMarkerIcon(order: number, state: MarkerState): L.DivIcon {
  const key = `${order}-${state}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "", // bỏ style mặc định (nền trắng) của divIcon
    html: `<div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-lg ${MARKER_STYLES[state]}">${order}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
  iconCache.set(key, icon);
  return icon;
}

function getMarkerState(isSelected: boolean, isHovered: boolean): MarkerState {
  if (isSelected) return "selected";
  if (isHovered) return "hover";
  return "default";
}

// Tự fitBounds khi tập tọa độ đổi (đổi ngày / thêm / xóa). Đổi thứ tự thì không chạy lại.
function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();

  // Dùng chuỗi key (đã sort) làm dependency để effect chỉ chạy khi tập tọa độ thay đổi
  const pointsKey = JSON.stringify(
    places
      .map((p): [number, number] => [p.lat, p.lng])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
  );

  useEffect(() => {
    const points = JSON.parse(pointsKey) as [number, number][];
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
  }, [map, pointsKey]);

  return null;
}

// Store -> bản đồ: chọn thẻ thì mở Popup của marker tương ứng
function SelectedPopupSync({ markerRefs }: { markerRefs: RefObject<Map<string, L.Marker>> }) {
  const map = useMap();
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId);

  useEffect(() => {
    if (selectedPlaceId == null) {
      map.closePopup();
      return;
    }
    const marker = markerRefs.current.get(String(selectedPlaceId));
    if (marker && !marker.isPopupOpen()) marker.openPopup();
  }, [map, markerRefs, selectedPlaceId]);

  return null;
}

interface TripMapProps {
  places?: Place[]; // Theo thứ tự hiển thị: marker đánh số 1, 2, 3...
}

export default function TripMap({ places = [] }: TripMapProps) {
  // center/zoom chỉ có tác dụng lúc mount (MapContainer không đổi theo props sau đó)
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = useMapStore((s) => s.setSelectedPlaceId);
  const hoveredPlaceId = useMapHoverStore((s) => s.hoveredPlaceId);

  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds places={places} />
      <SelectedPopupSync markerRefs={markerRefs} />

      {places.map((place, index) => {
        const isSelected = selectedPlaceId != null && String(selectedPlaceId) === place.id;
        const isHovered = hoveredPlaceId != null && String(hoveredPlaceId) === place.id;

        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={getMarkerIcon(index + 1, getMarkerState(isSelected, isHovered))}
            zIndexOffset={isSelected ? 1000 : isHovered ? 500 : 0}
            ref={(marker) => {
              if (marker) markerRefs.current.set(place.id, marker);
              else markerRefs.current.delete(place.id);
            }}
            eventHandlers={{
              click: () => setSelectedPlaceId(place.id),
              // Đóng popup (bấm ra ngoài / nút X) thì bỏ chọn, để bấm lại thẻ vẫn mở được popup
              popupclose: () => {
                if (String(useMapStore.getState().selectedPlaceId) === place.id) {
                  setSelectedPlaceId(null);
                }
              },
            }}
          >
            <Popup>{place.name}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}