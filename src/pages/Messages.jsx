import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Messages() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeConvo, setActiveConvo] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: conversations = [], isLoading: loadingConvos } = useQuery({
    queryKey: ['conversations', me?.id],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.list('-updated_date', 50);
      return convos.filter(c => c.participants?.includes(me.id));
    },
    enabled: !!me?.id,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeConvo?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: activeConvo.id }),
    enabled: !!activeConvo?.id,
    refetchInterval: 5000,
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle starting chat from Discover page
  useEffect(() => {
    if (location.state?.startChatWith && me) {
      const target = location.state.startChatWith;
      const existing = conversations.find(c =>
        c.type === 'direct' &&
        c.participants?.includes(me.id) &&
        c.participants?.includes(target.created_by_id)
      );
      if (existing) {
        setActiveConvo(existing);
      } else {
        startNewConversation(target);
      }
    }
  }, [location.state, me, conversations]);

  const startNewConversation = async (targetProfile) => {
    const convo = await base44.entities.Conversation.create({
      type: 'direct',
      participants: [me.id, targetProfile.created_by_id],
      participant_names: [myProfile?.display_name || 'Me', targetProfile.display_name],
      last_message: '',
      last_message_time: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setActiveConvo(convo);
  };

  const handleSend = async () => {
    if (!message.trim() || !activeConvo) return;
    setSending(true);
    await base44.entities.Message.create({
      conversation_id: activeConvo.id,
      sender_id: me.id,
      sender_name: myProfile?.display_name || 'Me',
      content: message,
      message_type: 'text',
    });
    await base44.entities.Conversation.update(activeConvo.id, {
      last_message: message,
      last_message_time: new Date().toISOString(),
    });
    setMessage('');
    setSending(false);
    refetchMessages();
  };

  const getOtherName = (convo) => {
    if (!convo.participant_names || !convo.participants) return 'Unknown';
    const idx = convo.participants.indexOf(me?.id);
    return convo.participant_names[idx === 0 ? 1 : 0] || 'Unknown';
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <h1 className="text-2xl font-bold font-display flex items-center gap-2 mb-4">
        <MessageCircle size={24} className="text-purple-500" />
        Messages
      </h1>

      <div className="flex-1 flex bg-card rounded-2xl border border-border overflow-hidden min-h-0">
        {/* Conversation List */}
        <div className={`w-full sm:w-80 border-r border-border flex-shrink-0 flex flex-col ${activeConvo ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border">
            <Input placeholder="Search conversations..." className="rounded-xl" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-purple-500" size={24} /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet. Connect with students to start chatting!</p>
              </div>
            ) : (
              conversations.map(convo => (
                <button
                  key={convo.id}
                  onClick={() => setActiveConvo(convo)}
                  className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                    activeConvo?.id === convo.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-bg-subtle flex items-center justify-center text-sm font-bold text-purple-600 shrink-0">
                      {getOtherName(convo)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{getOtherName(convo)}</p>
                      <p className="text-xs text-muted-foreground truncate">{convo.last_message || 'No messages yet'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeConvo ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConvo ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveConvo(null)} className="sm:hidden">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-8 h-8 rounded-lg gradient-bg-subtle flex items-center justify-center text-sm font-bold text-purple-600">
                  {getOtherName(activeConvo)?.[0]?.toUpperCase()}
                </div>
                <span className="font-medium">{getOtherName(activeConvo)}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMine = msg.sender_id === me?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMine ? 'gradient-bg text-white rounded-br-md' : 'bg-muted rounded-bl-md'
                      }`}>
                        {!isMine && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>}
                        <p>{msg.content}</p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="rounded-xl"
                />
                <Button size="icon" className="gradient-bg text-white border-0 shrink-0" onClick={handleSend} disabled={sending || !message.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}