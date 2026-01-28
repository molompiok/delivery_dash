import { io, Socket } from "socket.io-client";

class SocketClient {
    private socket: Socket | null = null;
    private static instance: SocketClient;

    private constructor() { }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    public connect(): Socket {
        if (!this.socket) {
            const getSocketUrl = () => {
                if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
                if (typeof window !== 'undefined') {
                    return `http://${window.location.hostname}:3333`;
                }
                return "http://localhost:3333";
            };
            this.socket = io(getSocketUrl(), {
                transports: ["websocket"],
                autoConnect: false,
            });

            this.socket.on("connect", () => {
                console.log("Socket connected:", this.socket?.id);
            });

            this.socket.on("disconnect", () => {
                console.log("Socket disconnected");
            });
        }
        return this.socket;
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketClient = SocketClient.getInstance();
