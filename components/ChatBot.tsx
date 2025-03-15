import React, { useState, useRef, useEffect } from 'react';
import { Message, ConversationState, ConversationStage, RequestType } from '../types/chat';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'שלום, אני מערכת הדיווח של חניה אורבנית - במה אוכל לעזור לכם?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    stage: ConversationStage.INITIAL,
    requestType: RequestType.UNKNOWN
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversationState
        }),
      });

      const data = await response.json();
      
      if (data.conversationState) {
        setConversationState(data.conversationState);
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.response,
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'מצטערים, אירעה שגיאה. אנא נסה שוב או צור קשר עם המוקד בטלפון.',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getInputPlaceholder = () => {
    switch (conversationState.stage) {
      case ConversationStage.INITIAL:
        return 'תאר במה נוכל לעזור...';
      case ConversationStage.GET_REQUEST_TYPE:
        return 'דיווח תקלה או השארת הודעה...';
      case ConversationStage.GET_CONTACT_INFO:
        return 'הזן מספר טלפון או מספר לקוח...';
      case ConversationStage.GET_SITE_ADDRESS:
        return 'הזן את כתובת האתר...';
      case ConversationStage.GET_ISSUE_DESCRIPTION:
        return 'תאר את התקלה...';
      case ConversationStage.GET_MESSAGE:
        return 'כתוב את הודעתך...';
      default:
        return 'הקלד כאן...';
    }
  };

  return (
    <div className="chat-wrapper" dir="rtl">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">חניה אורבנית - מערכת פניות</h1>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-sm font-medium opacity-90">מוקד שירות לקוחות</div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div 
                  className={`message-bubble ${
                    message.role === 'user' ? 'user-message' : 'assistant-message'
                  }`}
                >
                  <div className="text-sm whitespace-pre-line">{message.content}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="assistant-message px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="chat-footer">
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={getInputPlaceholder()}
              className="input-field"
              dir="rtl"
            />
            <button
              onClick={handleSend}
              className="send-button"
              disabled={isTyping}
            >
              <svg className="w-5 h-5 transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot; 