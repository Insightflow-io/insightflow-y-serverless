import * as WebSocket from 'ws'
import YSockets from '../helpers/ysockets'
import { toBase64, fromBase64 } from 'lib0/buffer'
const queryString = require('query-string');
 
const wss = new WebSocket.Server({ port: 5000 })

const ySockets = new YSockets();

const connectedClients = {};

wss.on('connection', (ws, req) => {
  console.log('connection')
  const sendToClient = async (name:string, message:Uint8Array) =>{
      if( connectedClients[name]){
        connectedClients[name].send(toBase64(message));
        console.log("Broadcasting Message to peers")
      }
  
  };

  const clientName = queryString.parse(req.url)["?name"];
  const docName = queryString.parse(req.url)["/?"];
  connectedClients[clientName] = ws;


  ySockets.onConnection(clientName,docName);

  ws.on('message', message => {
    console.log(message.toString());
    // message is b64 string
    console.log(`Received message => ${fromBase64(message.toString())}`)
    ySockets.onMessage(clientName, fromBase64(message.toString()), sendToClient);
    //ws.send(`Sent updates to peers`)
    console.log("Sending updates to peers")
  })

  //ws.send(`A ${clientName} connected to the  Server!`)
})

wss.on('close', (_ws, req) => {
    const name = queryString.parse(req.url)["?name"];
    ySockets.onDisconnect(name)
  //ws.send('Disconnected from Server')
});

console.log("Listening on ws://localhost:5000")



