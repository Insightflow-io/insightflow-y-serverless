export declare class YSockets {
    private ct;
    onConnection(connectionId: string, docName: string): Promise<void>;
    onDisconnect(connectionId: string): Promise<void>;
    onMessage(connectionId: string, message: Uint8Array, send: (id: string, message: Uint8Array) => Promise<void>): Promise<void>;
}
export default YSockets;
