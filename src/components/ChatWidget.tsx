import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, getHeaders } from '../config/api';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  created_at: number;
  is_admin: boolean;
}

export const ChatWidget: React.FC = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token && user) {
        connectWebSocket();
        fetchHistory();
    }
    return () => {
        if (socketRef.current) {
            socketRef.current.onclose = null; // Prevent reconnect on cleanup
            socketRef.current.close();
        }
    };
  }, [token, user]);

  const connectWebSocket = () => {
      if (!token) return;
      // Close existing connection if any
      if (socketRef.current) {
          socketRef.current.onclose = null; // Prevent reconnect on manual close
          socketRef.current.close();
      }

      const wsUrl = API_ENDPOINTS.chat.ws(token);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
          console.log('Connected to chat');
          setIsConnected(true);
      };

      ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'chat') {
                setMessages(prev => [...prev, data.payload]);
                scrollToBottom();
            }
          } catch (e) {
              console.error("Error parsing WS message", e);
          }
      };

      ws.onclose = () => {
          console.log('Disconnected from chat');
          setIsConnected(false);
          // Simple reconnect logic after 3s
          setTimeout(() => {
              if (user && token) connectWebSocket();
          }, 3000);
      };

      socketRef.current = ws;
  };

  const fetchHistory = async () => {
      if (!token) return;
      try {
          const res = await fetch(API_ENDPOINTS.chat.history, {
              headers: getHeaders(token)
          });
          const data = await res.json();
          if (Array.isArray(data)) {
              setMessages(data);
              scrollToBottom();
          }
      } catch (error) {
          console.error('Failed to fetch chat history', error);
      }
  };

  const scrollToBottom = () => {
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const sendMessage = () => {
      if (!input.trim() || !socketRef.current) return;
      
      // Payload structure matches what backend expects:
      // { type: "chat", payload: { content: "..." } }
      // Backend: json.Unmarshal(msg.Payload, &payload) where payload is { content: ... }
      
      const messageData = {
          type: 'chat',
          payload: JSON.stringify({ content: input }) 
      };
      
      // Wait, if I JSON.stringify the payload in JS, it becomes a string.
      // In Go, `Payload json.RawMessage`.
      // If I send `payload: { content: "..." }` (object), Go receives the JSON representation of that object.
      // If I send `payload: "{\"content\":...}"` (string), Go receives a JSON string.
      // json.RawMessage is just []byte.
      // If I send object, Go sees `{...}` bytes. json.Unmarshal(bytes, &target) works.
      // So sending OBJECT is correct.
      
      socketRef.current.send(JSON.stringify({
          type: 'chat',
          payload: { content: input }
      }));
      
      setInput('');
  };

  if (!user) return null; // Only show for logged in users

  return (
      <div className="fixed bottom-4 right-4 z-50">
          {!isOpen ? (
              <button 
                  onClick={() => setIsOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
              >
                  <MessageCircle size={24} />
              </button>
          ) : (
              <div className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col border border-gray-200" style={{ height: '500px' }}>
                  {/* Header */}
                  <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
                      <h3 className="font-semibold flex items-center gap-2">
                          <MessageCircle size={18} />
                          Hỗ trợ khách hàng
                      </h3>
                      <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
                          <X size={18} />
                      </button>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {messages.length === 0 && (
                          <div className="text-center text-gray-500 mt-10 text-sm">
                              Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                          </div>
                      )}
                      {messages.map((msg) => (
                          <div 
                              key={msg.id} 
                              className={`flex ${!msg.is_admin ? 'justify-end' : 'justify-start'}`}
                          >
                              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                  !msg.is_admin 
                                      ? 'bg-blue-600 text-white shadow-sm rounded-br-none' 
                                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none'
                              }`}>
                                  {msg.content}
                              </div>
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="p-3 border-t bg-white rounded-b-lg">
                      <div className="flex gap-2">
                          <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              placeholder="Nhập tin nhắn..."
                              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={!isConnected}
                          />
                          <button 
                              onClick={sendMessage}
                              disabled={!isConnected || !input.trim()}
                              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                              <Send size={18} />
                          </button>
                      </div>
                      {!isConnected && (
                           <p className="text-xs text-red-500 mt-1 text-center">Đang kết nối lại...</p>
                      )}
                  </div>
              </div>
          )}
      </div>
  );
};
