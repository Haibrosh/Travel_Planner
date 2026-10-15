import TripMapLoader from "@/components/map/TripMapLoader";

export default function MapSpikePage() {
  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-semibold">TripMap spike</h1>
      <div className="h-[500px] w-full">
        <TripMapLoader />
      </div>
    </main>
  );
}