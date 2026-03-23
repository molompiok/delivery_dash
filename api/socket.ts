import { io, Socket } from "socket.io-client";

type SocketHandler = (payload: any) => void;

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
            this.socket = io(this.getSocketUrl(), {
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

    public ensureConnected(): Socket {
        const socket = this.connect();
        if (!socket.connected) {
            socket.connect();
        }
        return socket;
    }

    public join(room: string) {
        if (!room) return;
        const socket = this.ensureConnected();
        socket.emit("join", room);
    }

    public leave(room: string) {
        if (!room) return;
        const socket = this.ensureConnected();
        socket.emit("leave", room);
    }

    public joinOrderRoom(orderId: string) {
        if (!orderId) return;
        this.join(`order:${orderId}`);
    }

    public joinWalletRoom(walletId: string): string | null {
        if (!walletId) return null;
        const room = `wallet:${walletId}`;
        this.join(room);
        return room;
    }

    public leaveWalletRoom(walletId: string): string | null {
        if (!walletId) return null;
        const room = `wallet:${walletId}`;
        this.leave(room);
        return room;
    }

    public joinFleetRoomFromStorage(): string | null {
        if (typeof window === "undefined") return null;
        const userStr = localStorage.getItem("delivery_user");
        if (!userStr) return null;

        try {
            const user = JSON.parse(userStr);
            const companyId = user?.effectiveCompanyId || user?.companyId;
            if (!companyId) return null;
            const room = `fleet:${companyId}`;
            this.join(room);
            return room;
        } catch {
            return null;
        }
    }

    public on(event: string, handler: SocketHandler): () => void {
        const socket = this.ensureConnected();
        socket.on(event, handler);
        return () => socket.off(event, handler);
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    private getSocketUrl(): string {
        if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
        if (typeof window !== "undefined") {
            return `${window.location.protocol}//${window.location.hostname}:3333`;
        }
        return "http://localhost:3333";
    }
}

export const socketClient = SocketClient.getInstance();
