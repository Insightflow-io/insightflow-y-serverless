"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const ysockets_1 = require("../helpers/ysockets");
const buffer_1 = require("lib0/buffer");
const queryString = require('query-string');
const wss = new WebSocket.Server({ port: 5000 });
const ySockets = new ysockets_1.default();
const connectedClients = {};
wss.on('connection', (ws, req) => {
    const sendToClient = async (name, message) => {
        if (connectedClients[name]) {
            connectedClients[name].send(buffer_1.toBase64(message));
            console.log("Broadcasting Message to peers");
        }
    };
    const clientName = queryString.parse(req.url)["?name"];
    const docName = queryString.parse(req.url)["/?"];
    connectedClients[clientName] = ws;
    ySockets.onConnection(clientName, docName);
    ws.on('message', message => {
        console.log(message.toString());
        // message is b64 string
        //console.log(`Received message => ${fromBase64(message.toString())}`)
        ySockets.onMessage(clientName, buffer_1.fromBase64(message.toString()), sendToClient);
        //ws.send(`Sent updates to peers`)
        console.log("Sending updates to peers");
    });
    //ws.send(`A ${clientName} connected to the  Server!`)
});
wss.on('close', (_ws, req) => {
    const name = queryString.parse(req.url)["?name"];
    ySockets.onDisconnect(name);
    //ws.send('Disconnected from Server')
});
console.log("Listening on ws://localhost:5000");
//# sourceMappingURL=index.js.map