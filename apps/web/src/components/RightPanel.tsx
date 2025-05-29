'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatResponse } from '../utils/chat';

interface Message {
  role: 'user' | 'assistant' | 'enhancement';
  content: string;
  timestamp: number;
  analysis?: {
    addDetails?: string;
    promptWarnings?: string;
    promptSwaps?: string;
    optimizedPrompt?: string;
  };
}

interface AnalysisSection {
  addDetails?: string;
  promptWarnings?: string;
  promptSwaps?: string;
  optimizedPrompt?: string;
}

interface RightPanelProps {
  currentAnalysis: AnalysisSection | null;
  onReplacePrompt?: (optimizedPrompt: string) => void;
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
  enhancementLoading: boolean;
  mode: 'image' | 'video';
  selectedArtMode: string | null;
}

const Notification: React.FC<{ message: string; isVisible: boolean }> = ({ message, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
      {message}
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
  </div>
);

export const RightPanel: React.FC<RightPanelProps> = ({ 
  currentAnalysis, 
  onReplacePrompt,
  currentPrompt,
  onPromptChange,
  enhancementLoading,
  mode,
  selectedArtMode
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Convert currentAnalysis to a message when it changes
  useEffect(() => {
    if (currentAnalysis) {
      const enhancementMessage: Message = {
        role: 'enhancement',
        content: 'Prompt Enhancement Analysis',
        timestamp: Date.now(),
        analysis: currentAnalysis
      };
      setMessages(prev => [...prev, enhancementMessage]);
    }
  }, [currentAnalysis]);

  // Handle notification timeout
  useEffect(() => {
    if (notification.isVisible) {
      const timer = setTimeout(() => {
        setNotification({ message: '', isVisible: false });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out enhancement messages before sending to chat API
      const chatMessages = [...messages, userMessage].filter(msg => msg.role !== 'enhancement');
      const response = await sendChatMessage(chatMessages, false, undefined, mode, selectedArtMode);
      
      if (response.response) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: response.response,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePhraseReplacement = (oldPhrase: string, newPhrase: string) => {
    // Clean up the phrases by removing any quotes and extra spaces
    const cleanOldPhrase = oldPhrase.replace(/['"]/g, '').trim();
    const cleanNewPhrase = newPhrase.replace(/['"]/g, '').trim();
    
    // Check if the old phrase exists in the current prompt (case-insensitive)
    if (!currentPrompt.toLowerCase().includes(cleanOldPhrase.toLowerCase())) {
      setNotification({ message: "Can't find word or phrase", isVisible: true });
      return;
    }

    // Replace the phrase (case-insensitive)
    const regex = new RegExp(cleanOldPhrase, 'gi');
    const newPrompt = currentPrompt.replace(regex, cleanNewPhrase);
    onPromptChange(newPrompt);
  };

  const renderAnalysisSection = (title: string, content?: string) => {
    if (!content) return null;
    
    const renderPromptSwaps = () => {
      if (title !== 'Prompt Swaps') return null;
      
      const phrases = content.split(',').map(phrase => phrase.trim()).filter(phrase => phrase);
      
      return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {phrases.map((phrase, index) => {
            const parts = phrase.split('->');
            if (parts.length !== 2) return null;
            
            const oldPhrase = parts[0].replace(/['"]/g, '').trim();
            const newPhrase = parts[1].replace(/['"]/g, '').trim();
            
            return (
              <button
                key={index}
                onClick={() => handlePhraseReplacement(oldPhrase, newPhrase)}
                className="px-2.5 py-1 bg-white border border-purple-200 rounded-full text-sm text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200"
              >
                {`${oldPhrase} -> ${newPhrase}`}
              </button>
            );
          })}
        </div>
      );
    };

    const renderAddDetails = () => {
      if (title !== 'Add Details') return null;

      const parts = content.split(/(\([^)]+\))/g);
      
      return (
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {parts.map((part, index) => {
            if (part.startsWith('(') && part.endsWith(')')) {
              const cleanPhrase = part.slice(1, -1).trim();
              const subPhrases = cleanPhrase.split(',').map(p => p.trim());
              
              return (
                <span key={index} className="inline-flex flex-wrap gap-1">
                  {subPhrases.map((subPhrase, subIndex) => (
                    <button
                      key={`${index}-${subIndex}`}
                      onClick={() => onPromptChange(currentPrompt + ', ' + subPhrase)}
                      className="px-2 py-0.5 bg-white border border-green-200 rounded-full text-sm text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors duration-200"
                    >
                      {subPhrase}
                    </button>
                  ))}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
      );
    };
    
    return (
      <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200">
        <div className="flex items-center justify-center space-x-1.5">
          {title === 'Prompt Warnings' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <h3 className="font-medium text-sm text-gray-700">{title}</h3>
        </div>
        {title === 'Prompt Swaps' ? (
          renderPromptSwaps()
        ) : title === 'Add Details' ? (
          renderAddDetails()
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-1">{content}</p>
        )}
        {title === 'Optimized Prompt' && onReplacePrompt && (
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={() => onReplacePrompt(content)}
              className="px-2 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-200"
            >
              Replace
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Notification message={notification.message} isVisible={notification.isVisible} />
      <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50 border-l border-yellow-400/30">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="flex flex-col">
            <div className="space-y-2">
              {enhancementLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-500 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    if (message.role === 'enhancement' && message.analysis) {
                      return (
                        <div key={`enhancement-${index}`} className="space-y-2">
                          {renderAnalysisSection('Add Details', message.analysis.addDetails)}
                          {renderAnalysisSection('Prompt Warnings', message.analysis.promptWarnings)}
                          {renderAnalysisSection('Prompt Swaps', message.analysis.promptSwaps)}
                          {renderAnalysisSection('Optimized Prompt', message.analysis.optimizedPrompt)}
                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t border-yellow-400/30"></div>
                            </div>
                            <div className="relative flex justify-center">
                              <span className="px-1.5 bg-gradient-to-b from-purple-50 to-blue-50 text-sm text-purple-600">
                                <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`msg-${index}`}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 text-sm border-2 ${
                              message.role === 'user'
                                ? 'bg-purple-600 text-white border-purple-700'
                                : 'bg-white text-gray-800 border-yellow-400/30'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    }
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-yellow-400/30 p-4 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-3 border-2 border-yellow-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm bg-white/80 backdrop-blur-sm"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm border-2 border-purple-700"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 