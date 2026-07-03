// AIChatPage.jsx - Friendly Accountability Partner Chatbot Interface
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockServices } from '../services/MockServices';
import { Send, Sparkles, Moon, HelpCircle, ArrowRight, User } from 'lucide-react';

const AIChatPage = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Load initial chat history
    const history = MockServices.getChatHistory();
    setMessages(history);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    // Send user message
    const { userMsg, aiMsg } = MockServices.sendChatMessage(textToSend);
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Trigger typing simulation
    setTyping(true);
    
    // Paced companion reply delay
    setTimeout(() => {
      setMessages(prev => [...prev, aiMsg]);
      setTyping(false);
    }, 1200);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  // Quick prompt bubbles
  const quickPrompts = [
    "How did I do today?",
    "Check my planning streak.",
    "Give me sleep encouragement.",
    "Tomorrow looks busy. Tips?"
  ];

  return (
    <div className="h-[calc(100vh-170px)] md:h-[calc(100vh-120px)] flex flex-col glass rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden relative">
      
      {/* Dynamic Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigoCalm-600 flex items-center justify-center text-white shadow-lg">
            <Moon className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">Clarity Companion</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Accountability Friend</span>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 text-xs text-indigoCalm-600 dark:text-indigoCalm-400 bg-indigoCalm-500/10 px-3 py-1.5 rounded-xl border border-indigoCalm-500/20">
          <Sparkles className="w-4 h-4" />
          <span>Active Context: Tomorrow's Schedule</span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 dark:bg-[#0a0c16]/30">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div 
              key={m.id}
              className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs ${isAi ? 'bg-indigoCalm-600 text-white shadow-md' : 'bg-slate-300 dark:bg-slate-800'}`}>
                {isAi ? <Moon className="w-4.5 h-4.5 fill-white" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`
                p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed text-left
                ${isAi 
                  ? 'bg-white dark:bg-[#14192f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-xs' 
                  : 'bg-indigoCalm-600 text-white rounded-tr-none shadow-md shadow-indigoCalm-600/10'}
              `}>
                <p className="whitespace-pre-line">{m.text}</p>
                <span className={`text-[9px] block mt-1.5 text-right font-medium ${isAi ? 'text-slate-400 dark:text-slate-500' : 'text-indigoCalm-200'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing loading simulator */}
        {typing && (
          <div className="flex gap-3 max-w-[85%] self-start mr-auto">
            <div className="w-8 h-8 rounded-lg bg-indigoCalm-600 text-white shadow-md flex items-center justify-center font-bold text-xs">
              <Moon className="w-4.5 h-4.5 fill-white" />
            </div>
            <div className="p-4 bg-white dark:bg-[#14192f] border border-slate-200 dark:border-slate-800 text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input panel & Quick prompts */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 space-y-4">
        
        {/* Quick Prompts Container */}
        {messages.length < 5 && (
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp)}
                className="px-3 py-1.5 bg-white dark:bg-[#121528] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1"
              >
                {qp}
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {/* Input box form */}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="text"
            required
            placeholder={`Ask about your tasks, reflection mood, or consistency streak...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 bg-white dark:bg-[#12162a] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigoCalm-500/40"
          />
          <button
            type="submit"
            className="px-4 py-3 bg-indigoCalm-600 hover:bg-indigoCalm-750 text-white rounded-2xl transition-colors flex items-center justify-center shadow-lg shadow-indigoCalm-600/10"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AIChatPage;
