import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { mockApi } from '../services/mockApi';
import { Send, MessageSquare, Loader2, Search } from 'lucide-react';
import type { ChatConversation, ChatMessage } from '../types';

export default function Chat() {
  const { user } = useAppContext();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('c-1');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getConversations().then(data => {
      setConversations(data);
      if (data.length > 0) {
        setActiveConvId(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (activeConvId) {
      mockApi.getMessages(activeConvId).then(msgs => setMessages(msgs));
    }
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText('');

    const newMsg = await mockApi.sendMessage(activeConvId, textToSend, user.id, user.fullName);
    setMessages(prev => [...prev, newMsg]);

    // Update conversation last message in local state
    setConversations(prev =>
      prev.map(c => (c.id === activeConvId ? { ...c, lastMessage: textToSend, updatedAt: newMsg.timestamp } : c))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Direct Messages</h1>
          <p className="text-slate-500 mt-1">Connect safely with finders and claimants to arrange item handovers.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden grid md:grid-cols-3 h-[600px]">
        {/* Left Column: Conversation List */}
        <div className="border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                  activeConvId === c.id ? 'bg-campus-50/60 border-l-4 border-campus-800' : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-campus-100 text-campus-800 flex items-center justify-center font-bold shrink-0">
                  {c.otherUser?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{c.otherUser.fullName}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{c.updatedAt}</span>
                  </div>
                  <p className="text-xs text-campus-700 font-semibold truncate mb-1">Item: {c.itemTitle}</p>
                  <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-campus-800 text-white flex items-center justify-center font-bold">
                    {activeConv.otherUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{activeConv.otherUser.fullName}</h3>
                    <p className="text-xs text-slate-500">{activeConv.otherUser.rollNumber} • Re: <span className="font-medium text-slate-700">{activeConv.itemTitle}</span></p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                        isMe ? 'bg-campus-800 text-white rounded-br-none shadow-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-campus-200' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Write a message to discuss handover..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-5 py-3 bg-campus-800 text-white font-medium rounded-xl hover:bg-campus-900 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <p>Select a conversation from the left to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
