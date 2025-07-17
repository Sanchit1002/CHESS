// Minimal Stockfish.js for browser/web worker use
// This is a placeholder for demonstration purposes only.

self.lastFen = "startpos";

onmessage = function(e) {
  if (typeof e.data === "string" && e.data.includes("position fen")) {
    self.lastFen = e.data.split('position fen ')[1];
  }
  if (typeof e.data === "string" && e.data.startsWith("go")) {
    setTimeout(function() {
      // Use the last FEN to determine whose turn it is
      if (self.lastFen && self.lastFen.split(' ')[1] === 'b') {
        // Black to move
        postMessage("bestmove e7e5");
      } else {
        // White to move
        postMessage("bestmove e2e4");
      }
    }, 500);
  }
  if (typeof e.data === "string" && e.data === "uci") {
    postMessage("uciok");
  }
};