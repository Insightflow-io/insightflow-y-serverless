import { ApiGatewayManagementApi } from "aws-sdk";
import { fromBase64, toBase64 } from "lib0/buffer";

import YSockets from "./helpers/ysockets";

const apigwManagementApi = new ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: process.env.APIG_ENDPOINT
});

const getDocName = (event:any) => {
  const qs:any = event.multiValueQueryStringParameters

  // convert to array
  // if value starts with "doc-" use the docname
  const values = Object.values(qs) as string[][];
  for(const val of values){
    if(val[0].startsWith('doc-')){
      return val[0];
    }
  }

  if (!qs || !qs.doc) {
    throw new Error('Client must specify doc name in parameter')
  }

  return qs.doc;
}

const send = async(id: string, message: Uint8Array) =>{
  await apigwManagementApi.postToConnection({
    ConnectionId: id,
    Data: toBase64(message)
  }).promise();
}

export async function handler(event) {
  // For debug purposes only.
  // You should not log any sensitive information in production.
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const { body, requestContext: { connectionId, routeKey }} = event;
  const ysockets = new YSockets();
  console.log('ysockets in Index', ysockets)

  switch(routeKey) {
    case '$connect':{
      const docName = getDocName(event)
      console.log('connect Docname', docName)
      await ysockets.onConnection(connectionId, docName)
      return { statusCode: 200, body: 'Connected.' }
    } 
    case '$disconnect':{
      await ysockets.onDisconnect(connectionId)
      return { statusCode: 200, body: 'Disconnected.' }
    }
    case '$default':
    default:
      console.log('connectionId in main', connectionId)
      await ysockets.onMessage(connectionId, fromBase64(body), send).catch(e => console.log(e))
      return { statusCode: 200, body: 'Data Sent' };
    
  }
}
