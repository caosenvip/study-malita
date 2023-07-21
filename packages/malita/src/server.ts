import WebSocket, { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';

export function createWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({
    noServer: true
  })

  server.on('upgrade', function upgrade(request, socket, head) {
    // 客户端认证 -- malita-hmr
    if (request.headers['sec-websocket-protocol'] === 'malita-hmr') {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
      });
    }
  });

  // socket链接成功
  wss.on('connection', (socket) => {
    // 发送connected, 触发客户端心跳检测机制
    socket.send(JSON.stringify({type: 'connected'}))
  });

  // socket链接失败
  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(
          `WebSocket server error:\n${e.stack || e.message}`,
      );
    }
  })

  return {
    send(message: string) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
    },
    wss,
    close() {
      wss.close()
    }
  }
}