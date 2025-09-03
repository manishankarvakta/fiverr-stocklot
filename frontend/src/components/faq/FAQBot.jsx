import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  MessageCircle, Send, Bot, User, ThumbsUp, ThumbsDown, 
  Search, ExternalLink, Loader2, X, Minimize2, Maximize2,
  HelpCircle, Lightbulb, Clock
} from 'lucide-react';

const FAQBot = ({ isOpen = false, onToggle, className = "" }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'bot',
        content: "Hi! I'm your StockLot assistant. I can help you with questions about buying, selling, payments, and more. What would you like to know?",
        timestamp: new Date(),
        suggestions: [
          "How do I create a buy request?",
          "What are the payment options?",
          "How does delivery work?",
          "What fees do you charge?"
        ]
      }]);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Search FAQ for relevant answers
      const response = await searchFAQ(message);
      
      // Add bot response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        sources: response.sources,
        confidence: response.confidence,
        faq_ids: response.faq_ids
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('FAQ search failed:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I couldn't find a good answer to your question right now. Please try rephrasing your question or contact our support team for help.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchFAQ = async (query) => {
    const token = localStorage.getItem('token');
    
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/faq/search?q=${encodeURIComponent(query)}&limit=3`,
      {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      }
    );

    if (!res.ok) {
      throw new Error('Search failed');
    }

    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) {
      return {
        content: "I couldn't find specific information about that topic. Here are some things I can help you with:\n\n• Creating and managing buy requests\n• Understanding payment and fees\n• Delivery and pickup options\n• Account verification and settings\n\nTry asking a more specific question, or contact our support team for personalized help.",
        confidence: 0,
        sources: [],
        faq_ids: []
      };
    }

    // Use the top result as the main answer
    const topResult = results[0];
    let content = topResult.answer;

    // Add related questions if multiple results
    if (results.length > 1) {
      content += "\n\n**Related topics:**\n";
      results.slice(1).forEach((result, index) => {
        content += `• ${result.title}\n`;
      });
    }

    return {
      content,
      confidence: topResult.similarity,
      sources: results.map(r => ({
        title: r.title,
        category: r.category,
        keywords: r.keywords
      })),
      faq_ids: results.map(r => r.id)
    };
  };

  const handleFeedback = async (messageId, isHelpful) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.faq_ids) return;

    try {
      const token = localStorage.getItem('token');

      // Record feedback for all FAQ entries that contributed to this answer
      for (const faqId of message.faq_ids) {
        await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/faq/${faqId}/feedback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              feedback_type: isHelpful ? 'helpful' : 'not_helpful'
            })
          }
        );
      }

      // Update message to show feedback was recorded
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, feedbackGiven: isHelpful ? 'helpful' : 'not_helpful' }
          : m
      ));

      // Show thank you message
      const thankYouMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: isHelpful 
          ? "Thanks for the feedback! Is there anything else I can help you with?"
          : "Thanks for the feedback. I'm always learning to provide better answers. Is there something specific you'd like to know?",
        timestamp: new Date(),
        isSystemMessage: true
      };

      setMessages(prev => [...prev, thankYouMessage]);

    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={`fixed bottom-4 right-4 rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg ${className}`}
        size="sm"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] shadow-xl border-2 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-blue-600" />
            StockLot Assistant
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Online
            </Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {/* Avatar */}
                    <div className={`flex items-center gap-2 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-blue-600 order-2' 
                          : 'bg-gray-100 order-1'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="h-3 w-3 text-white" />
                        ) : (
                          <Bot className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : message.isSystemMessage
                        ? 'bg-gray-50 text-gray-700 border'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />

                      {/* Confidence indicator */}
                      {message.confidence && message.confidence > 0.7 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                          <Lightbulb className="h-3 w-3" />
                          High confidence answer
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && (
                        <div className="mt-3 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSendMessage(suggestion)}
                              className="block w-full text-left text-xs p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600">
                            <ExternalLink className="h-3 w-3 inline mr-1" />
                            Sources: {message.sources.map(s => s.category).join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Feedback buttons */}
                      {message.type === 'bot' && !message.isSystemMessage && !message.isError && !message.feedbackGiven && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-gray-600">Was this helpful?</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, true)}
                            className="h-6 px-2 text-xs hover:bg-green-50"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Yes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, false)}
                            className="h-6 px-2 text-xs hover:bg-red-50"
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            No
                          </Button>
                        </div>
                      )}

                      {/* Feedback confirmation */}
                      {message.feedbackGiven && (
                        <div className="mt-2 text-xs text-gray-600">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Feedback recorded - thank you!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching for answers...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <Separator />

            {/* Input */}
            <div className="p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about StockLot..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                Powered by AI • Always learning from your feedback
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default FAQBot;