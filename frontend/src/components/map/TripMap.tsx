"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Place } from "@/types/place";
import { useMapStore } from "@/store/useMapStore";
import { useMapHoverStore } from "@/store/useMapHoverStore";
import { useItineraryStore, useSelectedDayItems } from "@/store/useItineraryStore";
import { getCategoryLabel } from "@/utils/placeCategory";

const DEFAULT_CENTER: L.LatLngTuple = [10.346, 107.084]; // Vũng Tàu
const DEFAULT_ZOOM = 13;

type MarkerState = "default" | "hover" | "selected";

const MARKER_BASE =
  "flex h-full w-full items-center justify-center rounded-full border-2 border-white text-xs font-extrabold text-white shadow-lg transition-transform";

const MARKER_STYLES: Record<MarkerState, string> = {
  default: `${MARKER_BASE} bg-teal-600`,
  hover: `${MARKER_BASE} bg-teal-600 scale-110`,
  selected: `${MARKER_BASE} bg-[#0F766E] ring-4 ring-teal-300/60 scale-110`,
};

const iconCache = new Map<string, L.DivIcon>();

function getMarkerIcon(order: number, state: MarkerState): L.DivIcon {
  const key = `${order}-${state}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const size = state === "selected" ? 36 : 30;
  const icon = L.divIcon({
    className: "",
    html: `<div class="${MARKER_STYLES[state]}">${order}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  iconCache.set(key, icon);
  return icon;
}

function getMarkerState(isSelected: boolean, isHovered: boolean): MarkerState {
  if (isSelected) return "selected";
  if (isHovered) return "hover";
  return "default";
}

// Tự căn khung khi đổi ngày / thêm / xóa địa điểm (đổi thứ tự thì không căn lại)
function FitBoundsController({ places, dayKey }: { places: Place[]; dayKey: string | null }) {
  const map = useMap();
  const lastFitKey = useRef<string | null>(null);

  useEffect(() => {
    const coordsKey = places
      .map((p) => `${p.id}:${p.lat},${p.lng}`)
      .sort()
      .join("|");
    const fitKey = `${dayKey ?? ""}|${coordsKey}`;
    if (lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;

    if (places.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    } else if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 15);
    } else {
      const points: L.LatLngTuple[] = places.map((p) => [p.lat, p.lng]);
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
    }
  }, [places, dayKey, map]);

  return null;
}

// Chọn thẻ -> dịch bản đồ tới marker và tự động mở Popup
function SelectedMarkerSync({
  places,
  selectedId,
  markerRefs,
}: {
  places: Place[];
  selectedId: string | null;
  markerRefs: RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  const lastPannedId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedId == null) {
      lastPannedId.current = null;
      map.closePopup();
      return;
    }

    const marker = markerRefs.current.get(String(selectedId));
    if (marker && !marker.isPopupOpen()) {
      marker.openPopup();
    }

    if (lastPannedId.current === selectedId) return;
    const target = places.find((p) => String(p.id) === String(selectedId));
    if (!target) return;
    lastPannedId.current = selectedId;

    const latLng = L.latLng(target.lat, target.lng);
    if (!map.getBounds().pad(-0.1).contains(latLng)) {
      map.panTo(latLng);
    }
  }, [selectedId, places, markerRefs, map]);

  return null;
}

interface TripMapProps {
  places?: Place[];
}

export default function TripMap({ places }: TripMapProps) {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const mapSelectedPlaceId = useMapStore((s) => s.selectedPlaceId);
  const setMapSelectedPlaceId = useMapStore((s) => s.setSelectedPlaceId);
  const hoveredPlaceId = useMapHoverStore((s) => s.hoveredPlaceId);

  const dayKey = useItineraryStore((s) => s.selectedDayKey);
  const itinerarySelectedPlaceId = useItineraryStore((s) => s.selectedPlaceId);
  const setItinerarySelectedPlaceId = useItineraryStore((s) => s.setSelectedPlaceId);
  const itineraryItems = useSelectedDayItems();

  const displayPlaces = useMemo<Place[]>(() => {
    if (places !== undefined) return places;
    return itineraryItems.map((i) => i.place);
  }, [places, itineraryItems]);

  const activeSelectedId =
    mapSelectedPlaceId != null ? String(mapSelectedPlaceId) : itinerarySelectedPlaceId;

  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  const routePositions: L.LatLngTuple[] = displayPlaces.map((p) => [p.lat, p.lng]);

  const handleSelectPlace = (placeId: string | null) => {
    setMapSelectedPlaceId(placeId);
    setItinerarySelectedPlaceId(placeId);
  };

  return (
    <MapContainer
      center={center ?? DEFAULT_CENTER}
      zoom={zoom ?? DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBoundsController places={displayPlaces} dayKey={dayKey} />
      <SelectedMarkerSync
        places={displayPlaces}
        selectedId={activeSelectedId}
        markerRefs={markerRefs}
      />

      {routePositions.length >= 2 && (
        <Polyline
          positions={routePositions}
          pathOptions={{ color: "#14b8a6", weight: 3, opacity: 0.8, dashArray: "6 8" }}
        />
      )}

      {displayPlaces.map((place, index) => {
        const isSelected = activeSelectedId != null && String(activeSelectedId) === String(place.id);
        const isHovered = hoveredPlaceId != null && String(hoveredPlaceId) === String(place.id);

        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={getMarkerIcon(index + 1, getMarkerState(isSelected, isHovered))}
            zIndexOffset={isSelected ? 1000 : isHovered ? 500 : 0}
            ref={(marker) => {
              if (marker) markerRefs.current.set(String(place.id), marker);
              else markerRefs.current.delete(String(place.id));
            }}
            eventHandlers={{
              click: () => handleSelectPlace(place.id),
              popupclose: () => {
                const currentMapSelected = useMapStore.getState().selectedPlaceId;
                const currentItinerarySelected = useItineraryStore.getState().selectedPlaceId;
                if (
                  String(currentMapSelected) === String(place.id) ||
                  String(currentItinerarySelected) === String(place.id)
                ) {
                  handleSelectPlace(null);
                }
              },
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold text-slate-900">{place.name}</div>
                {place.category && (
                  <div className="text-slate-500">{getCategoryLabel(place.category)}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
