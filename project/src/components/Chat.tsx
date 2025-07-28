import React from 'react';
import { Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  player: string;
  timestamp: any;
}

interface ChatProps {
  messages: ChatMessage[];
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  disabled = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && newMessage.trim()) {
      onSendMessage();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-700 bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
        <MessageCircle size={20} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Game Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-amber-400">{message.player}</span>
                <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
              </div>
              <div className="bg-gray-700 rounded-md px-3 py-2">
                <p className="text-sm text-white">{message.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 border-t border-gray-700"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={disabled ? "Spectators cannot chat" : "Type a message..."}
          disabled={disabled}
          className="flex-1 px-3 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !newMessage.trim()}
          className="p-2 bg-amber-600 hover:bg-amber-700 rounded-md text-white disabled:bg-gray-500 transition"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
