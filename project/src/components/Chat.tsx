import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentPlayerId: string;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, currentPlayerId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div 
        className="bg-amber-800 text-white p-3 flex items-center justify-between cursor-pointer hover:bg-amber-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle size={18} />
          <span className="font-semibold">Chat</span>
        </div>
        <div className="text-sm opacity-75">
          {isExpanded ? 'Click to minimize' : 'Click to expand'}
        </div>
      </div>

      {isExpanded && (
        <div className="h-80 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.playerId === currentPlayerId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`
                      max-w-xs px-3 py-2 rounded-lg text-sm
                      ${message.playerId === currentPlayerId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <div className="font-semibold text-xs opacity-75 mb-1">
                      {message.playerId === currentPlayerId ? 'You' : message.playerName}
                    </div>
                    <div>{message.message}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};