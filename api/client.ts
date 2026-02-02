const getApiUrl = () => {
    if ((import.meta as any).env?.VITE_API_URL) return (import.meta as any).env.VITE_API_URL;
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:3333/v1`;
    }
    return 'http://localhost:3333/v1';
};

const API_URL = getApiUrl();

interface FetchOptions extends RequestInit {
    params?: Record<string, any>;
    responseType?: 'json' | 'blob' | 'text';
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('delivery_token');
        }
        return null;
    }

    private buildURL(endpoint: string, params?: Record<string, any>): string {
        const url = new URL(endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`);

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, String(params[key]));
                }
            });
        }

        return url.toString();
    }

    private async request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<{ data: T, headers?: Headers }> {
        const { params, responseType = 'json', ...fetchOptions } = options;
        const url = this.buildURL(endpoint, params);

        const isFormData = fetchOptions.body instanceof FormData;

        const headers: Record<string, string> = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(fetchOptions.headers as Record<string, string>),
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('delivery_token');
                }
                throw new Error('Unauthorized');
            }

            // Handle other errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            if (responseType === 'blob') {
                const data = await response.blob() as unknown as T;
                return { data, headers: response.headers };
            }

            if (responseType === 'text') {
                const data = await response.text() as unknown as T;
                return { data, headers: response.headers };
            }

            // Handle empty responses (like 204 No Content)
            const text = await response.text();
            const data = text ? JSON.parse(text) : {};
            return { data, headers: response.headers };
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    async get<T = any>(endpoint: string, options: FetchOptions = {}): Promise<{ data: T, headers?: Headers }> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<{ data: T, headers?: Headers }> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        });
    }

    async put<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<{ data: T, headers?: Headers }> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        });
    }

    async patch<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<{ data: T, headers?: Headers }> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        });
    }

    async delete<T = any>(endpoint: string, body?: any, options: FetchOptions = {}): Promise<{ data: T, headers?: Headers }> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
        });
    }
}

const client = new ApiClient(API_URL);

export default client;
