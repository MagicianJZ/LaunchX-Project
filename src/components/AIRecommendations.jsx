import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, UserPlus, MessageCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function AIRecommendations({ myProfile, candidates, getConnectionStatus, onConnect, onMessage }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);

  const generate = async () => {
    if (!myProfile) {
      toast({ title: 'Complete your profile first', description: 'Add your interests so we can find matches.' });
      return;
    }
    setLoading(true);
    try {
      const pool = candidates.slice(0, 30).map(p => ({
        id: p.id,
        display_name: p.display_name,
        grade: p.grade,
        bio: p.bio,
        interests: p.interests || [],
        skills: p.skills || [],
        looking_for: p.looking_for || [],
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a matchmaking assistant for a high school student networking platform. 
Given the current student's profile and a pool of other students, pick the top 5 students who would be the best connections based on shared interests, complementary skills, and aligned goals.

Current student:
${JSON.stringify({
  display_name: myProfile.display_name,
  grade: myProfile.grade,
  bio: myProfile.bio,
  interests: myProfile.interests || [],
  skills: myProfile.skills || [],
  looking_for: myProfile.looking_for || [],
}, null, 2)}

Candidate students:
${JSON.stringify(pool, null, 2)}

For each recommendation, give a short, friendly, specific reason (max 15 words) explaining why they'd be a great match. Only include students from the candidate list.`,
        response_json_schema: {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  reason: { type: 'string' },
                  match_score: { type: 'number' },
                },
                required: ['id', 'reason'],
              },
            },
          },
          required: ['matches'],
        },
      });

      const enriched = (result.matches || [])
        .map(m => ({ ...m, profile: candidates.find(c => c.id === m.id) }))
        .filter(m => m.profile);
      setMatches(enriched);
      if (enriched.length === 0) {
        toast({ title: 'No matches found', description: 'Try connecting with students in the list below.' });
      }
    } catch (e) {
      toast({ title: 'Something went wrong', description: 'Could not generate matches. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-purple-50 to-pink-50 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold font-display text-foreground">AI Matches</h2>
            <p className="text-xs text-muted-foreground">Personalized recommendations based on your interests</p>
          </div>
        </div>
        <Button size="sm" className="gradient-bg text-white border-0" onClick={generate} disabled={loading}>
          {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Sparkles size={14} className="mr-1.5" />}
          {matches ? 'Refresh' : 'Find my matches'}
        </Button>
      </div>

      {matches && matches.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {matches.map(({ profile, reason }) => {
            const status = getConnectionStatus(profile);
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-bg-subtle flex items-center justify-center font-bold text-purple-600 shrink-0">
                    {profile.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{profile.display_name}</h3>
                    {profile.grade && <span className="text-xs text-muted-foreground">{profile.grade}</span>}
                  </div>
                </div>
                <div className="flex items-start gap-1.5 mt-3">
                  <Sparkles size={14} className="text-purple-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic">{reason}</p>
                </div>
                <div className="mt-3">
                  {status === 'accepted' ? (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => onMessage?.(profile)}>
                      <MessageCircle size={14} className="mr-1.5" /> Message
                    </Button>
                  ) : status === 'pending' ? (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      <Clock size={14} className="mr-1.5" /> Pending
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full gradient-bg text-white border-0" onClick={() => onConnect?.(profile)}>
                      <UserPlus size={14} className="mr-1.5" /> Connect
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}