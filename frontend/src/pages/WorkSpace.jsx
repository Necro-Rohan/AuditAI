import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { INTENTS } from '../config/constants.js';
import api from '../services/api.js';
import { Send, Bot, User, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- Sub-Component: Chart Renderer ---
const ChartMessage = ({ title, data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="p-4 text-sm text-slate-500">No data available for this query.</div>;
  }

  return (
    <div className="mt-2 w-full max-w-full flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      
      <div className="min-w-0" style={{ width: '100%', height: '300px', position: 'relative' }}>
        <ResponsiveContainer width="99%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="period" 
              interval="preserveStartEnd" 
              minTickGap={50}             
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94a3b8' }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            <Line 
              type="monotone" 
              name="NPS Score" 
              dataKey="npsScore" 
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Summary Renderer ---
const SummaryMessage = ({ title, content }) => (
  <div className="mt-2 w-full max-w-3xl rounded-xl border border-brand-100 bg-brand-50/30 p-5 shadow-sm">
    <h3 className="mb-3 text-sm font-semibold text-brand-900">{title}</h3>
    <div className="prose prose-sm prose-slate max-w-none text-slate-700">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export const Workspace = () => {
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);

  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('all');
  const [category, setCategory] = useState('all');
  
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: 'ai',
      type: 'text',
      content: `Hello ${user?.username}. I am your Analytics AI. Ask me for NPS trends or review summaries based on your assigned categories.`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const SUGGESTED_PROMPTS = [
    "Show me the overall NPS trend",
    "Summarize the latest feedback for mobile",
    "What can we improve based on negative reviews?"
  ];

  // --- Load Persistent History on Mount or Domain/Category Change ---
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/chat/history', {
          params: { domain, category }
        });

        if (res.data.length === 0) {
          // Fresh Session / Context Expired
          setMessages([
            {
              id: crypto.randomUUID(),
              role: 'ai',
              type: 'text',
              content: `Hello ${user?.username}. We've started a fresh context for ${domain} > ${category}. Ask me for NPS trends or strategic insights.`
            }
          ]);
        } else {
          // Restore Memory
          const formatted = res.data.flatMap(entry => {
            const msgs = [];
            // Rebuild User Message
            msgs.push({ id: crypto.randomUUID(), role: 'user', content: entry.query });
            
            // Rebuild AI Response
            if (entry.responseType === 'chart' || entry.responseType === 'summary') {
              msgs.push({
                id: crypto.randomUUID(),
                role: 'ai',
                type: entry.responseType,
                title: entry.finalResponse?.title,
                content: entry.finalResponse?.data
              });
            }
            return msgs;
          });

          // Prepend a discrete "Restored Session" banner bubble
          setMessages([
            {
              id: crypto.randomUUID(),
              role: 'ai',
              type: 'text',
              content: `Restored recent context for ${category}. You can ask follow-up questions.`
            },
            ...formatted
          ]);
        }
      } catch (err) {
        console.error("Failed to restore chat history:", err.response || err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [domain, category, user?.username]);

  const handleSuggestedClick = (prompt) => {
    setQuery(prompt);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query.trim();
    setQuery('');
    
    setMessages((prev) => [
      ...prev, 
      { id: crypto.randomUUID(), role: 'user', content: userText }
    ]);
    
    setIsLoading(true);

    try {
      const response = await api.post('/chat', {
        query: userText,
        domain: domain,
        category: category
      });

      // Defensive destructuring
      const { type = INTENTS.ERROR, title = 'Analytics Response', data: payload } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          type: type,
          title: title,
          content: payload || 'No data was returned for this query.'
        }
      ]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          type: INTENTS.ERROR,
          content: error.response?.data?.error || "A connection error occurred. Please verify database connectivity."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      
      {/* TOP FILTERS */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Domain:</label>
          <select 
            value={domain} 
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Domains</option>
            {user?.assignedDomains?.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category:</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Categories</option>
            {user?.assignedCategories?.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* CHAT FEED */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-none w-full space-y-6 px-4">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              <div className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'order-last mr-0 ml-3 bg-slate-100 text-slate-600' : 'bg-brand-600 text-white'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${msg.type === INTENTS.CHART ? 'w-full' : 'max-w-[90%] md:max-w-[85%]'}`}>
                
                {msg.role === 'user' && (
                  <div className="rounded-2xl rounded-tr-sm bg-slate-800 px-4 py-2.5 text-sm text-white shadow-sm">
                    {msg.content}
                  </div>
                )}

                {msg.role === 'ai' && msg.type === 'text' && (
                  <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                    {msg.content}
                    
                    {/* Empty State Prompts (Only show on first AI message) */}
                    {index === 0 && (
                      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                        <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Sparkles className="h-3 w-3" /> Suggested queries
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_PROMPTS.map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => handleSuggestedClick(prompt)}
                              className="rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-1.5 text-xs text-brand-700 transition-colors hover:bg-brand-100 hover:text-brand-900 focus:outline-none"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'ai' && msg.type === INTENTS.ERROR && (
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 shadow-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {msg.content}
                  </div>
                )}

                {msg.role === 'ai' && msg.type === INTENTS.SUMMARY && (
                  <SummaryMessage title={msg.title} content={msg.content} />
                )}

                {msg.role === 'ai' && msg.type === INTENTS.CHART && (
                  <ChartMessage title={msg.title} data={msg.content} />
                )}

              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span className="ml-2 text-sm text-slate-500">Processing inquiry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="E.g., Show me the NPS trend for Q3..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Send className="h-5 w-5 ml-1" />
          </button>
        </form>
        <div className="mt-2 text-center text-[10px] text-slate-400">
          AI-generated insights. Verify critical data against raw logs.
        </div>
      </div>
    </div>
  );
};