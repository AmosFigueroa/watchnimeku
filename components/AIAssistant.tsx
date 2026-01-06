import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';
import { getGeminiRecommendation } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hi! I am your AI movie guide. Tell me what you feel like watching today? (e.g., "Sad anime", "Action movies from 2024")',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await getGeminiRecommendation(userMsg.text);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-[#1ce783] hover:bg-[#16b565] text-black p-4 rounded-full shadow-lg shadow-green-900/20 transition-all duration-300 transform hover:scale-110 flex items-center gap-2 font-bold ${isOpen ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <Sparkles className="w-6 h-6" />
        <span className="hidden md:inline">AI Picks</span>
      </button>

      {/* Chat Interface */}
      <div className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 w-[90vw] md:w-[400px] h-[500px] bg-[#1a1c21] rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-700 transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-[#1ce783] p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-black" />
            <h3 className="font-bold text-black text-lg">StreamHulu AI</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-black hover:bg-black/10 p-1 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#282a31] text-white rounded-br-none border border-gray-600' 
                    : 'bg-green-900/20 text-gray-200 border border-green-800/50 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-green-900/20 p-3 rounded-2xl rounded-bl-none flex gap-1">
                <span className="w-2 h-2 bg-[#1ce783] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#1ce783] rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-[#1ce783] rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 bg-[#0b0c0f] rounded-b-2xl">
          <div className="flex items-center gap-2 bg-[#1a1c21] border border-gray-600 rounded-full px-4 py-2 focus-within:border-[#1ce783] transition">
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm"
              placeholder="Ask about movies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="text-[#1ce783] hover:text-white disabled:opacity-50 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;