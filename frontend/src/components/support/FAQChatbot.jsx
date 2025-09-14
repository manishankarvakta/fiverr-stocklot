import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../ui';
import { 
  MessageCircle, Send, Bot, User, Minimize2, Maximize2, X, 
  HelpCircle, Search, Lightbulb, Phone, Mail, Brain, Zap
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Enhanced FAQ Data with better livestock focus
const FAQ_DATA = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I buy livestock on StockLot?",
        a: "Simply browse our marketplace, click 'Add to Cart' on animals you want to purchase, then proceed to checkout. We'll handle the secure payment and connect you with the seller for delivery arrangements.",
        keywords: ["buy", "purchase", "livestock", "animals", "how to buy"]
      },
      {
        q: "How do I sell my animals?",
        a: "Create a seller account, then click 'Sell Livestock' to create your listing. Add photos, details, and pricing. We'll help connect you with buyers across South Africa.",
        keywords: ["sell", "seller", "listing", "create", "animals"]
      },
      {
        q: "Is StockLot safe to use?",
        a: "Yes! We use secure escrow payments, verify all sellers, and provide buyer protection. Your money is held safely until you confirm delivery.",
        keywords: ["safe", "secure", "escrow", "protection", "verify"]
      }
    ]
  },
  {
    category: "Livestock Types",
    questions: [
      {
        q: "What types of livestock can I buy?",
        a: "We offer cattle, goats, sheep, poultry (chickens, ducks), pigs, and small livestock like rabbits. All animals are health-certified and ready for sale.",
        keywords: ["cattle", "goats", "sheep", "poultry", "chickens", "pigs", "types", "animals"]
      },
      {
        q: "Do you have breeding stock?",
        a: "Yes! We have high-quality breeding bulls, rams, boars, and hens from certified breeders. Each comes with breeding records and health certificates.",
        keywords: ["breeding", "bulls", "rams", "boars", "breeding stock", "genetics"]
      },
      {
        q: "Are your animals vaccinated?",
        a: "All livestock on our platform are required to be vaccinated according to South African veterinary standards. Health certificates are provided with each purchase.",
        keywords: ["vaccinated", "health", "certificates", "veterinary", "standards"]
      }
    ]
  },
  {
    category: "Payments & Delivery",
    questions: [
      {
        q: "How do payments work?",
        a: "We use secure escrow payments. Your money is held safely until you confirm delivery. Sellers receive payment after successful delivery confirmation. We accept all major South African banks.",
        keywords: ["payments", "escrow", "money", "banks", "delivery confirmation"]
      },
      {
        q: "What are the delivery options?",
        a: "Sellers offer various delivery options: farm pickup, local delivery, or professional livestock transport. Delivery costs are calculated based on distance and animal type.",
        keywords: ["delivery", "transport", "pickup", "shipping", "costs"]
      },
      {
        q: "Do you provide livestock transport?",
        a: "Yes! Our network includes certified livestock transporters who ensure safe, stress-free transport of your animals with proper ventilation and water systems.",
        keywords: ["transport", "transporters", "livestock transport", "safe transport"]
      }
    ]
  },
  {
    category: "Quality & Health",
    questions: [
      {
        q: "How do you ensure animal quality?",
        a: "All sellers must provide health certificates, vaccination records, and recent photos. We verify seller credentials and have a buyer protection program.",
        keywords: ["quality", "health certificates", "vaccination", "verification", "protection"]
      },
      {
        q: "What if I'm not satisfied with my purchase?",
        a: "We offer buyer protection. If animals don't match the description or have undisclosed health issues, you can file a dispute within 7 days for a full refund.",
        keywords: ["satisfaction", "refund", "dispute", "buyer protection", "not satisfied"]
      },
      {
        q: "Can I inspect animals before buying?",
        a: "Yes! Many sellers allow farm visits for inspection. You can also request additional photos, videos, or veterinary reports before purchase.",
        keywords: ["inspect", "inspection", "farm visit", "photos", "videos", "reports"]
      }
    ]
  },
  {
    category: "Pricing & Market",
    questions: [
      {
        q: "How are livestock prices determined?",
        a: "Prices are set by sellers based on breed, age, weight, quality, and current market conditions. Our AI provides market insights to ensure fair pricing.",
        keywords: ["prices", "pricing", "market", "fair price", "breed", "age", "weight"]
      },
      {
        q: "Do you offer market price alerts?",
        a: "Yes! You can set up price alerts for specific livestock types, breeds, or locations. We'll notify you when animals matching your criteria are available.",
        keywords: ["price alerts", "notifications", "market alerts", "criteria"]
      },
      {
        q: "Can I negotiate prices?",
        a: "Some sellers allow price negotiations, especially for bulk purchases. Look for the 'Make Offer' button on listings or contact sellers directly.",
        keywords: ["negotiate", "negotiations", "bulk", "make offer", "contact seller"]
      }
    ]
  }
];

// Enhanced Popular Questions with ML insights
const POPULAR_QUESTIONS = [
  "How do I buy cattle on StockLot?",
  "What are the delivery costs for livestock?", 
  "Are your animals health certified?",
  "How do escrow payments work?",
  "Can I inspect animals before purchase?",
  "Do you have breeding stock available?",
  "What livestock transport options do you offer?",
  "How do I become a verified seller?"
];

const FAQChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 Hi! I'm your StockLot AI assistant. I can help you with livestock trading, payments, and more. I'm continuously learning from our conversations to serve you better!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [learningMode, setLearningMode] = useState(true);
  const [showFAQSuggestions, setShowFAQSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialize chat session with ML tracking
  useEffect(() => {
    if (isOpen && !currentSession) {
      setCurrentSession({
        id: Date.now().toString(),
        started_at: new Date(),
        user_questions: [],
        bot_responses: [],
        satisfaction_score: null
      });
    }
  }, [isOpen, currentSession]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced answer finding with ML scoring
  const findBestAnswer = (question) => {
    const lowerQuestion = question.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    FAQ_DATA.forEach(category => {
      category.questions.forEach(faq => {
        let score = 0;
        
        // Exact match gets highest score
        if (faq.q.toLowerCase() === lowerQuestion) {
          score = 100;
        } else {
          // Keyword-based scoring
          const questionWords = lowerQuestion.split(' ').filter(word => word.length > 2);
          const faqWords = faq.q.toLowerCase().split(' ').concat(faq.keywords || []);
          
          questionWords.forEach(word => {
            if (faqWords.some(faqWord => faqWord.includes(word) || word.includes(faqWord))) {
              score += 10;
            }
          });
          
          // Category relevance boost
          if (lowerQuestion.includes(category.category.toLowerCase())) {
            score += 5;
          }
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = { ...faq, category: category.category, score };
        }
      });
    });

    return highestScore > 15 ? bestMatch : null;
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
        content: data.response || "I'm having trouble right now, but our support team can help!\n\n📧 Email: hello@stocklot.farm",
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
          content: "I don't have a specific answer for that question, but our support team can help! You can:\n\n📧 Email: hello@stocklot.farm\n💬 Or browse the FAQ suggestions below for common questions.",
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
                  hello@stocklot.farm
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FAQChatbot;