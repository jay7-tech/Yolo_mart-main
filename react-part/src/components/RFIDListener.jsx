import { useEffect, useState } from 'react';
import { Scan } from 'lucide-react';

export default function RFIDListener() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:3001');

        ws.onopen = () => {
          console.log('✅ Connected to RFID scanner');
          setScanning(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'RFID_SCAN' && data.product) {
              console.log('📡 RFID Scanned:', data.rfid);
              console.log('📦 Product:', data.product.name);
              
              setLastScan(data);
              
              // Show notification
              showScanNotification(data.product);
              
              // Navigate to product page after a short delay
              setTimeout(() => {
                window.location.href = `/product/${data.product.id}`;
              }, 500);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          console.log('❌ Disconnected from RFID scanner');
          setScanning(false);
          
          // Reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const showScanNotification = (product) => {
    // You can replace this with a toast notification library
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">📡</div>
        <div>
          <div style="font-size: 14px; opacity: 0.9;">Product Scanned!</div>
          <div style="font-size: 16px;">${product.name}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  // Visual indicator that RFID is active
  if (!scanning) return null;

  return (
    <div className="fixed bottom-27 left-2 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 z-50">
      <div className="relative">
        <Scan className="w-5 h-5 text-green-500" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      <span className="text-sm font-medium text-gray-700">RFID Active</span>
    </div>
  );
}