import React, { useEffect, useRef } from 'react';

const StockfishDemo = () => {
  const stockfishRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Don't try to load stockfish.js if it doesn't exist
    // This prevents crashes when the file is missing
    try {
      const stockfish = new Worker('/stockfish.js');
      stockfishRef.current = stockfish;

      stockfish.onmessage = (event: MessageEvent) => {
        console.log('Stockfish says:', event.data);
      };

      stockfish.postMessage('uci');
    } catch (error) {
      console.log('Stockfish not available:', error);
    }

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
      }
    };
  }, []);

  return (
    <div>
      <h2>Stockfish WASM Demo</h2>
      <p>Open the console to see Stockfish output.</p>
    </div>
  );
};

export default StockfishDemo; 