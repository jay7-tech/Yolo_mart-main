const readline = require('readline');

class RFIDWatcher {
  constructor(onScan) {
    this.onScan = onScan;
    this.buffer = '';
    this.timeout = null;
  }

  start() {
    console.log('✅ RFID watcher started - Ready to scan!');
    
    // Set up readline to capture stdin (keyboard input)
    readline.emitKeypressEvents(process.stdin);
    
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      // Handle Ctrl+C to exit gracefully
      if (key && key.ctrl && key.name === 'c') {
        process.exit();
      }

      // RFID scanners send digits followed by Enter
      if (key && key.name === 'return') {
        if (this.buffer.length > 0) {
          console.log(`✅ RFID Scanned: ${this.buffer}`);
          this.onScan(this.buffer);
          this.buffer = ''; // Clear buffer
        }
      } else if (str) {
        // Accumulate characters
        this.buffer += str;
        
        // Auto-clear buffer after 2 seconds of inactivity
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          this.buffer = '';
        }, 2000);
      }
    });
  }

  stop() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    console.log('RFID watcher stopped');
  }
}

module.exports = RFIDWatcher;
