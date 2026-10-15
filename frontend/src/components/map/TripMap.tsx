"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const VUNG_TAU: [number, number] = [10.346, 107.084];

// Leaflet tìm icon mặc định bằng đường dẫn tương đối nên bị vỡ ảnh khi qua bundler,
// vì vậy khai báo icon tường minh.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function TripMap() {
  return (
    <MapContainer
      center={VUNG_TAU}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={VUNG_TAU} icon={defaultIcon}>
        <Popup>Vũng Tàu</Popup>
      </Marker>
    </MapContainer>
  );
}