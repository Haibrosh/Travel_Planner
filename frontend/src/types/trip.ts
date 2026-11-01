export type TripTab = 'itinerary' | 'budget' | 'checklist' | 'collab';

export interface CreateTripRequest {
  destinationId: number;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface TripResponse {
  tripId: number;
  ownerId: number;
  ownerUsername: string;
  destinationId: number;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: 'PLANNING' | 'COMPLETED' | string;
  createdAt: string;
  updatedAt: string;
}
