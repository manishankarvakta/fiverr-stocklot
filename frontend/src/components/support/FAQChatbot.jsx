import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../ui';
import { 
  MessageCircle, Send, Bot, User, Minimize2, Maximize2, X, 
  HelpCircle, Search, Lightbulb, Phone, Mail
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// FAQ Data - In production this would come from backend
const FAQ_DATA = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I buy livestock on StockLot?",
        a: "Simply browse our marketplace, click 'Add to Cart' on animals you want to purchase, then proceed to checkout. We'll handle the secure payment and connect you with the seller for delivery arrangements."
      },
      {
        q: "How do I sell my animals?",
        a: "Create a seller account, then click 'Sell Livestock' to create your listing. Add photos, details, and pricing. We'll help connect you with buyers across South Africa."
      },
      {
        q: "Is StockLot safe to use?",
        a: "Yes! We use secure escrow payments, verify all sellers, and provide buyer protection. Your money is held safely until you confirm delivery."
      }
    ]
  },
  {
    category: "Payments & Shipping",
    questions: [
      {
        q: "How do payments work?",
        a: "We use secure escrow payments. Your money is held safely until you confirm delivery. Sellers receive payment after successful delivery confirmation."
      },
      {
        q: "What are the shipping costs?",
        a: "Shipping costs vary by seller and distance. Most sellers offer both standard and express shipping options. Costs are shown during checkout."
      },
      {
        q: "Do I need to add my banking details?",
        a: "Yes, for selling livestock you'll need to add your South African bank account details in Payment Methods. This is where we'll send your earnings."
      }
    ]
  },
  {
    category: "Livestock & Quality",
    questions: [
      {
        q: "What animals can I buy?",
        a: "We offer cattle, goats, sheep, pigs, chickens, and other livestock. All animals are from verified South African farmers and suppliers."
      },
      {
        q: "Are the animals healthy?",
        a: "We encourage all sellers to provide veterinary health certificates. Look for the 'Vet Certified' badge on listings for extra assurance."
      },
      {
        q: "Can I inspect animals before buying?",
        a: "Yes! You can message sellers directly to arrange inspections. Many sellers also provide additional photos and videos upon request."
      }
    ]
  },
  {
    category: "Support & Contact",
    questions: [
      {
        q: "How do I contact customer support?",
        a: "Use this chat for instant help, email us at support@stocklot.co.za, or call our SA support line. We're here to help with any questions."
      },
      {
        q: "What if there's a problem with my order?",
        a: "Contact us immediately. We offer buyer protection and will work with you and the seller to resolve any issues. Your satisfaction is guaranteed."
      }
    ]
  }
];

export default function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi there! 👋 I'm here to help you with questions about buying and selling livestock on StockLot. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFAQSuggestions, setShowFAQSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestAnswer = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    // Simple keyword matching - in production this would use AI/NLP
    for (const category of FAQ_DATA) {
      for (const faq of category.questions) {
        const keywords = faq.q.toLowerCase().split(' ');
        const questionWords = lowerQuestion.split(' ');
        
        // Check for keyword matches
        let matches = 0;
        keywords.forEach(keyword => {
          if (questionWords.some(word => word.includes(keyword) || keyword.includes(word))) {
            matches++;
          }
        });
        
        // If enough keywords match, return this answer
        if (matches >= 2 || lowerQuestion.includes(faq.q.toLowerCase().substring(0, 10))) {
          return {
            answer: faq.a,
            category: category.category,
            confidence: matches / keywords.length
          };
        }
      }
    }
    
    return null;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setShowFAQSuggestions(false);

    try {
      // Use AI-powered FAQ endpoint
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API}/faq/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: inputMessage
        })
      });

      const data = await response.json();
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response || "I'm having trouble right now, but our support team can help!\n\n📧 Email: hello@stocklot.co.za",
        source: data.source || 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error('AI FAQ error:', error);
      
      // Fallback to keyword matching
      const answer = findBestAnswer(inputMessage);
      
      let botResponse;
      if (answer) {
        botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: answer.answer,
          category: answer.category,
          source: 'fallback',
          timestamp: new Date()
        };
      } else {
        botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: "I don't have a specific answer for that question, but our support team can help! You can:\n\n📧 Email: hello@stocklot.co.za\n💬 Or browse the FAQ suggestions below for common questions.",
          source: 'fallback',
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendFAQQuestion = (faq) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: faq.q,
      timestamp: new Date()
    };

    const botResponse = {
      id: Date.now() + 1,
      type: 'bot',
      content: faq.a,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setShowFAQSuggestions(false);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Floating chat button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-10 right-0 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
          Need help? Chat with us!
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-emerald-600 text-white">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <div>
              <DialogTitle className="text-white">StockLot Support</DialogTitle>
              <DialogDescription className="text-emerald-100">
                We're here to help!
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-emerald-700"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-emerald-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.type === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm border'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && <Bot className="h-4 w-4 mt-0.5 text-emerald-600" />}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.category && (
                          <Badge className="mt-1 text-xs bg-emerald-100 text-emerald-700">
                            {message.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-emerald-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ Suggestions */}
              {showFAQSuggestions && (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Popular questions:</p>
                  </div>
                  {FAQ_DATA.slice(0, 2).map((category) => (
                    <div key={category.category} className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">{category.category}</p>
                      {category.questions.slice(0, 2).map((faq, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => sendFAQQuestion(faq)}
                          className="w-full text-left justify-start text-sm h-auto p-2 whitespace-normal"
                        >
                          <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                          {faq.q}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question about StockLot..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  support@stocklot.co.za
                </div>
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  +27 11 123 4567
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}