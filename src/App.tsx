/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Zap, 
  Target, 
  Eye, 
  AlertTriangle, 
  MessageSquare, 
  ChevronRight, 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  Menu, 
  X,
  Trash2,
  Plus,
  Edit2,
  ExternalLink,
  Smartphone,
  Crosshair,
  ShieldAlert,
  Send,
  Bot,
  User,
  Copy,
  RefreshCw
} from 'lucide-react';
import { getChatResponse } from './services/geminiService';

// --- Types ---
interface User {
  id: number;
  email: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration: string;
}

interface Order {
  id: string;
  user_id?: number;
  user_email?: string;
  telegram_id: string;
  service_id: number;
  service_name: string;
  amount: number;
  utr: string;
  status: string;
  created_at: string;
}

// --- Components ---

const AuthModal = ({ onClose, onLogin }: { onClose: () => void, onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return alert('Fill all fields');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          onLogin(data.user);
          onClose();
        } else {
          alert('Registration successful! Please login.');
          setIsLogin(true);
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-mars-card w-full max-w-md p-8 rounded-2xl border border-mars-red/20 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-black uppercase italic">{isLogin ? 'Login' : 'Register'}</h2>
          <p className="text-gray-400 text-sm mt-2">Access your orders and keys</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-display uppercase tracking-widest text-gray-500">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red" placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-display uppercase tracking-widest text-gray-500">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red" placeholder="••••••••" />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-xl bg-mars-red/10 border-2 border-mars-red text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red transition-all">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm text-gray-400 hover:text-mars-red transition-colors">
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UserDashboard = ({ user, onClose }: { user: User, onClose: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/user/orders/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  }, [user.id]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="fixed inset-0 z-[200] bg-mars-dark overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-black uppercase italic">My Orders</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setLoading(true);
                fetch(`/api/user/orders/${user.id}`)
                  .then(res => res.json())
                  .then(data => {
                    setOrders(data);
                    setLoading(false);
                  });
              }}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><X /></button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="mars-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-mars-red font-mono font-bold">{order.id}</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest">{order.status}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Telegram: <span className="text-white font-medium">{order.telegram_id}</span> | 
                    Pack: <span className="text-white font-medium">{order.service_name}</span> | 
                    UTR: <span className="text-white font-medium">{order.utr || 'Pending'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">₹{order.amount}</div>
                  <div className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am the Mars AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await getChatResponse(userMessage, history);
      setMessages(prev => [...prev, { role: 'model', text: response || 'Sorry, I encountered an error.' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'I am having trouble connecting right now. Please try again later or contact support via Telegram.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 mars-gradient rounded-full flex items-center justify-center mars-glow hover:scale-110 transition-transform shadow-2xl"
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-white" />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[60] w-[350px] md:w-[400px] h-[500px] bg-mars-card border border-mars-red/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 mars-gradient flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">Mars AI Assistant</h3>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-white/70 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-mars-red text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-mars-red rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-mars-red rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-mars-red rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about features, pricing..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-mars-red transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={isTyping || !input.trim()}
                  className="w-10 h-10 mars-gradient rounded-xl flex items-center justify-center hover:mars-glow transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Navbar = ({ onAdminClick, user, onAuthClick, onDashboardClick, onLogout }: { 
  onAdminClick: () => void, 
  user: User | null, 
  onAuthClick: () => void, 
  onDashboardClick: () => void,
  onLogout: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-mars-dark/80 backdrop-blur-md border-b border-mars-red/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 mars-gradient rounded-lg flex items-center justify-center mars-glow">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="font-display font-black text-2xl tracking-tighter italic">MARS<span className="text-mars-red">LOADER</span></span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              <button onClick={() => scrollTo('features')} className="hover:text-mars-red transition-colors font-medium cursor-pointer">Features</button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-mars-red transition-colors font-medium cursor-pointer">Pricing</button>
              <button onClick={() => scrollTo('help')} className="hover:text-mars-red transition-colors font-medium cursor-pointer">Help Desk</button>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <button onClick={onDashboardClick} className="text-sm font-medium hover:text-mars-red transition-colors">My Orders</button>
                  <button onClick={onLogout} className="text-sm font-medium text-gray-500 hover:text-white transition-colors">Logout</button>
                </div>
              ) : (
                <button onClick={onAuthClick} className="text-sm font-medium hover:text-mars-red transition-colors">Login / Register</button>
              )}

              <button 
                onClick={onAdminClick}
                className="mars-gradient px-4 py-2 rounded-lg mars-glow transition-all font-display text-xs uppercase tracking-widest font-bold"
              >
                Admin Panel
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-400 hover:text-white">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-mars-card border-b border-mars-red/10 px-4 pt-2 pb-6 space-y-4"
          >
            <button onClick={() => scrollTo('features')} className="w-full text-left px-3 py-2 text-base font-medium hover:text-mars-red">Features</button>
            <button onClick={() => scrollTo('pricing')} className="w-full text-left px-3 py-2 text-base font-medium hover:text-mars-red">Pricing</button>
            <button onClick={() => scrollTo('help')} className="w-full text-left px-3 py-2 text-base font-medium hover:text-mars-red">Help Desk</button>
            
            {user ? (
              <>
                <button onClick={() => { onDashboardClick(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium hover:text-mars-red">My Orders</button>
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium text-gray-500">Logout</button>
              </>
            ) : (
              <button onClick={() => { onAuthClick(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium hover:text-mars-red">Login / Register</button>
            )}

            <button 
              onClick={() => { onAdminClick(); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 text-base font-medium text-mars-red font-bold"
            >
              Admin Panel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FeatureCard: React.FC<{ icon: any, title: string, description: string }> = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="mars-card group"
  >
    <div className="w-12 h-12 bg-mars-red/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-mars-red/20 transition-colors">
      <Icon className="text-mars-red w-6 h-6" />
    </div>
    <h3 className="font-display text-lg font-bold mb-2 uppercase tracking-tight">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const PricingCard: React.FC<{ service: Service, onSelect: (s: Service) => void }> = ({ service, onSelect }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="mars-card flex flex-col items-center text-center relative overflow-hidden"
  >
    {service.duration === "Full Season" && (
      <div className="absolute top-4 -right-12 bg-mars-red text-white text-[10px] font-bold py-1 px-12 rotate-45 uppercase tracking-widest">
        Best Value
      </div>
    )}
    <span className="text-gray-400 text-xs font-display uppercase tracking-widest mb-2">{service.duration}</span>
    <div className="text-4xl font-display font-black mb-4">₹{service.price}</div>
    <h3 className="text-xl font-bold mb-6">{service.name}</h3>
    <ul className="text-sm text-gray-400 space-y-3 mb-8 w-full">
      <li className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-mars-red" /> All Features Included</li>
      <li className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-mars-red" /> 24/7 Support</li>
      <li className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-mars-red" /> Instant Activation</li>
    </ul>
    <button 
      onClick={() => onSelect(service)}
      className="w-full py-4 rounded-xl bg-mars-red/10 border-2 border-mars-red text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red hover:mars-glow transition-all duration-300 group-hover:scale-105"
    >
      Select Pack
    </button>
  </motion.div>
);

const CheckoutModal = ({ service, onClose, userId }: { service: Service, onClose: () => void, userId?: number }) => {
  const [step, setStep] = useState(1);
  const [telegramId, setTelegramId] = useState('');
  const [utr, setUtr] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    console.log('handleNext called, step:', step, 'loading:', loading);
    if (loading) return;
    setError(null);
    
    if (step === 1) {
      console.log('Processing step 1, telegramId:', telegramId);
      if (!telegramId.trim()) {
        return setError('Please enter your Telegram ID');
      }
      setLoading(true);
      try {
        const payload = { 
          telegramId: telegramId.trim(), 
          serviceId: Number(service.id), 
          amount: Number(service.price), 
          userId: userId ? Number(userId) : null 
        };
        console.log('Sending order request with payload:', payload);
        
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (res.ok && data.orderId) {
          setOrderId(data.orderId);
          setStep(2);
        } else {
          setError(data.error || 'Failed to create order. Please try again.');
        }
      } catch (err) {
        console.error('Order creation error:', err);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!utr.trim()) return setError('Please enter the UTR/Transaction ID');
      setLoading(true);
      try {
        const res = await fetch('/api/orders/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, utr: utr.trim() })
        });
        if (res.ok) {
          setStep(3);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to confirm payment.');
        }
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-mars-card w-full max-w-md p-8 rounded-2xl border border-mars-red/20 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X />
        </button>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-black uppercase italic">Order Details</h2>
              <p className="text-gray-400 text-sm mt-2">Pack: {service.name} (₹{service.price})</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-display uppercase tracking-widest text-gray-500">Telegram ID</label>
              <input 
                type="text" 
                placeholder="@username"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red transition-colors"
              />
            </div>
            <button 
              type="button"
              onClick={() => {
                console.log('Proceed button clicked');
                handleNext();
              }}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-mars-red/10 border-2 border-mars-red text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red hover:mars-glow transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-black uppercase italic">Payment</h2>
              <p className="text-gray-400 text-sm mt-2">Scan QR or pay to the UPI ID below</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="bg-black/50 p-6 rounded-2xl border border-mars-red/10 text-center space-y-4">
              {/* QR Code */}
              <div className="bg-white p-2 rounded-xl w-40 h-40 mx-auto mb-2 border-2 border-mars-red/20">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=LTD.SURAJ@YBL&pn=Mars%20Loader&am=" 
                  alt="Payment QR"
                  className="w-full h-full"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-display uppercase tracking-widest text-gray-500">UPI ID</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-lg font-mono font-bold text-mars-red">LTD.SURAJ@YBL</div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('LTD.SURAJ@YBL');
                      alert('UPI ID copied!');
                    }}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-3xl font-display font-black">₹{service.price}</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-display uppercase tracking-widest text-gray-500">UTR / Transaction ID</label>
              <input 
                type="text" 
                placeholder="12-digit UTR number"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-display font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                disabled={loading}
                className="flex-[2] py-4 rounded-xl bg-mars-red/10 border-2 border-mars-red text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red hover:mars-glow transition-all duration-300"
              >
                {loading ? 'Verifying...' : 'Submit Payment'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-display font-black uppercase italic">Order Placed!</h2>
            <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-2">
              <div className="text-xs font-display uppercase tracking-widest text-gray-500">Order ID</div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-lg font-mono font-bold text-mars-red">{orderId}</div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(orderId);
                    alert('Order ID copied!');
                  }}
                  className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your payment is being verified. You will receive your key on Telegram <span className="text-white font-bold">{telegramId}</span> shortly.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-mars-red/10 border border-mars-red/20 text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red/20 transition-all"
              >
                Close
              </button>
              <a 
                href="https://t.me/MARS_DEMON" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-display text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-center"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'services'>('orders');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', price: 0, duration: '' });
  const [orderForm, setOrderForm] = useState({ telegramId: '', amount: 0, utr: '', status: '' });

  const handleLogin = async () => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, password })
    });
    if (res.ok) {
      setIsLoggedIn(true);
      fetchData();
    } else {
      alert('Invalid credentials');
    }
  };

  const fetchData = async () => {
    const [ordersRes, servicesRes] = await Promise.all([
      fetch('/api/admin/orders'),
      fetch('/api/services')
    ]);
    setOrders(await ordersRes.json());
    setServices(await servicesRes.json());
  };

  const deleteOrder = async (id: string) => {
    if (confirm('Delete this order?')) {
      await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch('/api/admin/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, status })
    });
    fetchData();
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const res = await fetch('/api/admin/orders/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId: editingOrder.id,
        ...orderForm
      })
    });

    if (res.ok) {
      setEditingOrder(null);
      fetchData();
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
    const method = editingService ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceForm)
    });

    if (res.ok) {
      setIsAddingService(false);
      setEditingService(null);
      setServiceForm({ name: '', price: 0, duration: '' });
      fetchData();
    }
  };

  const deleteService = async (id: number) => {
    if (confirm('Delete this service?')) {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-mars-card w-full max-w-md p-8 rounded-2xl border border-mars-red/20 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-mars-red mx-auto mb-4" />
            <h2 className="text-2xl font-display font-black uppercase italic">Admin Access</h2>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
            />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
            />
            <button onClick={handleLogin} className="w-full py-4 rounded-xl mars-gradient font-display font-bold uppercase tracking-widest">Login</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-[200] bg-mars-dark overflow-y-auto"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-black uppercase italic">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`px-6 py-2 rounded-lg font-display text-xs uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'mars-gradient mars-glow text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Orders
              </button>
              <button 
                onClick={() => setActiveTab('services')} 
                className={`px-6 py-2 rounded-lg font-display text-xs uppercase tracking-widest transition-all ${activeTab === 'services' ? 'mars-gradient mars-glow text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Services
              </button>
            </div>
            <button 
              onClick={fetchData}
              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><X /></button>
          </div>
        </div>

        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="mars-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-mars-red font-mono font-bold">{order.id}</span>
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-xs bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest border-none focus:ring-0 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-400">
                    User: <span className="text-white font-medium">{order.user_email || 'Guest'}</span> | 
                    Telegram: <span className="text-white font-medium">{order.telegram_id}</span> | 
                    Pack: <span className="text-white font-medium">{order.service_name}</span> | 
                    UTR: <span className="text-white font-medium">{order.utr || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">₹{order.amount}</div>
                    <div className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingOrder(order);
                        setOrderForm({ 
                          telegramId: order.telegram_id, 
                          amount: order.amount, 
                          utr: order.utr || '', 
                          status: order.status 
                        });
                      }}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-gray-500 hover:text-mars-red transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div key={service.id} className="mars-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <p className="text-mars-red font-display">₹{service.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingService(service);
                        setServiceForm({ name: service.name, price: service.price, duration: service.duration });
                      }}
                      className="p-2 text-gray-500 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteService(service.id)}
                      className="p-2 text-gray-500 hover:text-mars-red"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">{service.duration}</div>
              </div>
            ))}
            <button 
              onClick={() => {
                setIsAddingService(true);
                setServiceForm({ name: '', price: 0, duration: '' });
              }}
              className="mars-card border-dashed border-2 border-white/10 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-mars-red hover:border-mars-red/50"
            >
              <Plus className="w-8 h-8" />
              <span className="font-display text-xs uppercase tracking-widest">Add Service</span>
            </button>
          </div>
        )}

        {/* Order Edit Modal */}
        {editingOrder && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-mars-card w-full max-w-md p-8 rounded-2xl border border-mars-red/20 relative">
              <button type="button" onClick={() => setEditingOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
              <h2 className="text-2xl font-display font-black uppercase italic mb-8">Edit Order</h2>
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">Telegram ID</label>
                  <input 
                    type="text" 
                    value={orderForm.telegramId} 
                    onChange={(e) => setOrderForm({ ...orderForm, telegramId: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={orderForm.amount} 
                    onChange={(e) => setOrderForm({ ...orderForm, amount: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">UTR / Transaction ID</label>
                  <input 
                    type="text" 
                    value={orderForm.utr} 
                    onChange={(e) => setOrderForm({ ...orderForm, utr: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">Status</label>
                  <select 
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 rounded-xl mars-gradient font-display font-bold uppercase tracking-widest mt-4">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Service Form Modal */}
        {(isAddingService || editingService) && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-mars-card w-full max-w-md p-8 rounded-2xl border border-mars-red/20 relative">
              <button 
                type="button"
                onClick={() => {
                  setIsAddingService(false);
                  setEditingService(null);
                }} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X />
              </button>
              <h2 className="text-2xl font-display font-black uppercase italic mb-8">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">Name</label>
                  <input 
                    type="text" 
                    value={serviceForm.name} 
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                    placeholder="e.g. 1 Day Pack"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">Price (₹)</label>
                  <input 
                    type="number" 
                    value={serviceForm.price} 
                    onChange={(e) => setServiceForm({ ...serviceForm, price: parseInt(e.target.value) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                    placeholder="e.g. 100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-display uppercase tracking-widest text-gray-500">Duration</label>
                  <input 
                    type="text" 
                    value={serviceForm.duration} 
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-mars-red"
                    placeholder="e.g. 1 Day"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-4 rounded-xl mars-gradient font-display font-bold uppercase tracking-widest mt-4">
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    fetch('/api/services')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch services');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          console.error('Invalid services data:', data);
        }
      })
      .catch(err => {
        console.error('Error fetching services:', err);
      });
    
    // Check local storage for user session
    const savedUser = localStorage.getItem('mars_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mars_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mars_user');
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-mars-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="scanline" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mars-red/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mars-red/5 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center relative z-10"
        >
          <div className="w-20 h-20 mars-gradient rounded-2xl flex items-center justify-center mars-glow mx-auto mb-8">
            <Shield className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black uppercase italic mb-4 leading-tight">
            MARS<span className="text-mars-red">LOADER</span> <br />
            <span className="text-2xl opacity-50">Access Restricted</span>
          </h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Welcome to the most advanced BGMI enhancement platform. Please login or create an account to view features and place orders.
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setShowAuth(true)}
              className="w-full py-4 rounded-xl bg-mars-red/10 border-2 border-mars-red text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red hover:mars-glow transition-all duration-300"
            >
              Login / Register Now
            </button>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Secure Kernel-Level Technology</p>
          </div>
        </motion.div>

        <AnimatePresence>
          {showAuth && (
            <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-mars-dark selection:bg-mars-red selection:text-white"
    >
      <div className="scanline" />
      
      <Navbar 
        onAdminClick={() => setShowAdmin(true)} 
        user={user}
        onAuthClick={() => setShowAuth(true)}
        onDashboardClick={() => setShowDashboard(true)}
        onLogout={handleLogout}
      />

      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="relative pt-32 pb-20 px-4 overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mars-red/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mars-red/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mars-red/10 border border-mars-red/20 mb-8">
              <ShieldAlert className="w-4 h-4 text-mars-red" />
              <span className="text-xs font-display uppercase tracking-widest text-mars-red font-bold">Undetected & Secure</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter italic mb-6 leading-none">
              DOMINATE THE <br />
              <span className="text-mars-red">BATTLEGROUND</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-10 leading-relaxed">
              Experience the next level of gaming with Mars Loader. The most advanced, secure, and feature-rich BGMI enhancement tool.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-mars-red/10 border-2 border-mars-red text-white font-display font-bold uppercase tracking-widest hover:bg-mars-red hover:mars-glow transition-all duration-300"
              >
                Get Started Now
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white/5 border-2 border-white/20 font-display font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-300"
              >
                Explore Features
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-20 px-4 bg-black/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase italic mb-4">Core <span className="text-mars-red">Features</span></h2>
            <p className="text-gray-400">Everything you need to become a pro player instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Shield} title="Anti-Cheat Bypass" description="Advanced kernel-level bypass technology that keeps you safe from bans." />
            <FeatureCard icon={Crosshair} title="Magic Bullet" description="Bullets that find their way to the target even if you miss slightly." />
            <FeatureCard icon={Zap} title="Bullet Track" description="Visual tracking of every shot fired for perfect accuracy." />
            <FeatureCard icon={Target} title="Aimbot" description="Smooth, humanized aim assistance with customizable FOV and speed." />
            <FeatureCard icon={Eye} title="360° Alert ESP" description="See enemies through walls with distance, health, and skeleton view." />
            <FeatureCard icon={AlertTriangle} title="Grenade Warning" description="Visual and audio alerts for incoming grenades and projectiles." />
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        id="pricing" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-20 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase italic mb-4">Choose Your <span className="text-mars-red">Pack</span></h2>
            <p className="text-gray-400">Affordable pricing for every type of player.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {services.length > 0 ? (
              services.map(service => (
                <PricingCard key={service.id} service={service} onSelect={setSelectedService} />
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white/5 rounded-3xl border border-white/10">
                <AlertTriangle className="w-12 h-12 text-mars-red mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold uppercase">No Packs Available</h3>
                <p className="text-gray-400 mt-2">Please check back later or contact support.</p>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Help Desk Section */}
      <motion.section 
        id="help" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-20 px-4 bg-black/30"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="mars-card p-12">
            <MessageSquare className="w-16 h-16 text-mars-red mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase italic mb-6">24/7 <span className="text-mars-red">Help Desk</span></h2>
            <p className="text-gray-400 text-lg mb-10">Need help with installation or have questions? Our team is available 24/7 on Telegram.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a 
                href="https://t.me/demon_x_here" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 hover:bg-[#229ED9]/20 transition-all group"
              >
                <Smartphone className="text-[#229ED9]" />
                <span className="font-bold">@demon_x_here</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="https://t.me/MARSLOADERBOSS" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 hover:bg-[#229ED9]/20 transition-all group"
              >
                <Smartphone className="text-[#229ED9]" />
                <span className="font-bold">@MARSLOADERBOSS</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 mars-gradient rounded flex items-center justify-center">
              <Shield className="text-white w-4 h-4" />
            </div>
            <span className="font-display font-black text-xl tracking-tighter italic">MARS<span className="text-mars-red">LOADER</span></span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Mars Loader. All rights reserved. For educational purposes only.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowAdmin(true)} className="text-gray-500 hover:text-mars-red transition-colors text-sm font-display uppercase tracking-widest">Admin Panel</button>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {selectedService && (
          <CheckoutModal service={selectedService} onClose={() => setSelectedService(null)} userId={user?.id} />
        )}
        {showAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />
        )}
        {showDashboard && user && (
          <UserDashboard user={user} onClose={() => setShowDashboard(false)} />
        )}
      </AnimatePresence>

      <Chatbot />
    </motion.div>
  );
}
