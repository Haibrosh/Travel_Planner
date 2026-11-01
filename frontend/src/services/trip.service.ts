import axiosClient from './axiosClient';
import type { CreateTripRequest, TripResponse } from '@/types/trip';

export const tripService = {
  // Lấy danh sách chuyến đi của user hiện tại (GET /api/v1/trips)
  getMyTrips: async (): Promise<TripResponse[]> => {
    const response = await axiosClient.get<TripResponse[]>('/api/v1/trips');
    return response as unknown as TripResponse[];
  },

  // Lấy chi tiết chuyến đi theo ID (GET /api/v1/trips/{id})
  getTripById: async (tripId: number | string): Promise<TripResponse> => {
    const response = await axiosClient.get<TripResponse>(`/api/v1/trips/${tripId}`);
    return response as unknown as TripResponse;
  },

  // Tạo chuyến đi mới (POST /api/v1/trips)
  createTrip: async (data: CreateTripRequest): Promise<TripResponse> => {
    const response = await axiosClient.post<TripResponse>('/api/v1/trips', data);
    return response as unknown as TripResponse;
  },

  // Xóa chuyến đi theo ID (DELETE /api/v1/trips/{id})
  deleteTrip: async (tripId: number | string): Promise<{ message: string }> => {
    const response = await axiosClient.delete<{ message: string }>(`/api/v1/trips/${tripId}`);
    return response as unknown as { message: string };
  },
};
