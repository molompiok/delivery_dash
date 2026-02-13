import client from "./client";

export const geoApi = {
    reverseGeocode: async (lat: number, lng: number) => {
        const response = await client.get<{ street: string, city: string, country: string }>(`/geo/reverse`, {
            params: { lat, lng }
        });
        return response.data;
    }
};
