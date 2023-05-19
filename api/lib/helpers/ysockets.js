"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YSockets = void 0;
const connections_1 = require("./connections");
const syncProtocol = require("y-protocols/sync");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");
const Y = require("yjs");
const messageSync = 0;
const messageAwareness = 1;
class YSockets {
    constructor() {
        this.ct = new connections_1.ConnectionsTableHelper();
    }
    async onConnection(connectionId, docName) {
        const { ct } = this;
        console.log('connectionTableHelper', ct);
        console.log('connectionId', connectionId);
        console.log('docName', docName);
        await ct.createConnection(connectionId, docName);
        const doc = await ct.getOrCreateDoc(docName);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeSyncStep1(encoder, doc);
        // TODO: cannot send message during connection.. Need to broadcast likely
        // await send({ context, message: encoding.toUint8Array(encoder), id })
        console.log(`${connectionId} connected`);
    }
    async onDisconnect(connectionId) {
        const { ct } = this;
        await ct.removeConnection(connectionId);
        console.log(`${connectionId} disconnected`);
    }
    async onMessage(connectionId, message, send) {
        const { ct } = this;
        console.log('ConnectionID in ysockets', connectionId);
        const docName = (await ct.getConnection(connectionId)).DocName;
        const connectionIds = await ct.getConnectionIds(docName);
        const otherConnectionIds = connectionIds.filter((id) => id !== connectionId);
        const broadcast = (message) => {
            return Promise.all(otherConnectionIds.map((id) => {
                return send(id, message);
            }));
        };
        const doc = await ct.getOrCreateDoc(docName);
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);
        switch (messageType) {
            // Case sync1: Read SyncStep1 message and reply with SyncStep2 (send doc to client wrt state vector input)
            // Case sync2 or yjsUpdate: Read and apply Structs and then DeleteStore to a y instance (append to db, send to all clients)
            case messageSync:
                encoding.writeVarUint(encoder, messageSync);
                const messageType = decoding.readVarUint(decoder);
                switch (messageType) {
                    case syncProtocol.messageYjsSyncStep1:
                        syncProtocol.writeSyncStep2(encoder, doc, decoding.readVarUint8Array(decoder));
                        break;
                    case syncProtocol.messageYjsSyncStep2:
                    case syncProtocol.messageYjsUpdate:
                        const update = decoding.readVarUint8Array(decoder);
                        Y.applyUpdate(doc, update);
                        await broadcast(message);
                        await ct.updateDoc(docName, update);
                        break;
                    default:
                        throw new Error("Unknown message type");
                }
                if (encoding.length(encoder) > 1) {
                    await send(connectionId, encoding.toUint8Array(encoder));
                }
                break;
            case messageAwareness: {
                await broadcast(message);
                break;
            }
        }
    }
}
exports.YSockets = YSockets;
exports.default = YSockets;
//# sourceMappingURL=ysockets.js.map