import client from './client';
import { User } from './types';

export interface LoginResponse {
    type: 'bearer';
    token: string;
    user: User;
}

export const authService = {
    // Step 1: Request OTP
    async sendOtp(phone: string) {
        // Assuming there is an endpoint for this, referencing backend logic
        // POST /v1/auth/phone/otp/send
        return client.post('/auth/phone/otp/send', { phone });
    },

    // Step 2: Verify OTP and Login
    async login(phone: string, otp: string) {
        // POST /v1/auth/phone/otp/verify
        const response = await client.post<LoginResponse>('/auth/phone/otp/verify', { phone, otp });
        if (response.data.token) {
            localStorage.setItem('delivery_token', response.data.token);
            // Store basic user info if needed
            localStorage.setItem('delivery_user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async getProfile() {
        return client.get<User>('/auth/me'); // Assuming /auth/me exists or similar
    },

    logout() {
        localStorage.removeItem('delivery_token');
        localStorage.removeItem('delivery_user');
    }
};
