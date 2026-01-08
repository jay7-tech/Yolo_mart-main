const WebSocket = require('ws');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();

    this.wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcastRFIDScan(rfid, product) {
    this.broadcast({
      type: 'RFID_SCAN',
      rfid: rfid,
      product: product,
      timestamp: Date.now()
    });
  }
}

module.exports = WebSocketServer;