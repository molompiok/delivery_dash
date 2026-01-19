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
            // Connect to the same host/port as the API (proxied via Vite or direct)
            // Assuming API is at localhost:3333, but Vite acts as proxy or we point directly.
            // Since we are in dev, backend is 3333.
            // Ideally this comes from env, but we'll hardcode localhost:3333 for this environment.
            this.socket = io("http://localhost:3333", {
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
