import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Users, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const REACTIONS = ['🔥', '💡', '🚀', '👏', '❤️', '🤔'];

export default function PitchDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [selectedReaction, setSelectedReaction] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: pitch, isLoading } = useQuery({
    queryKey: ['pitch', id],
    queryFn: () => base44.entities.ProjectPitch.get(id),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['pitch-comments', id],
    queryFn: () => base44.entities.PitchComment.filter({ pitch_id: id }),
  });

  const handleComment = async () => {
    if (!comment.trim()) return;
    await base44.entities.PitchComment.create({
      pitch_id: id,
      content: comment,
      author_display_name: myProfile?.display_name || 'Anonymous',
      reaction: selectedReaction,
    });
    await base44.entities.ProjectPitch.update(id, { comments_count: (pitch.comments_count || 0) + 1 });
    setComment('');
    setSelectedReaction('');
    queryClient.invalidateQueries({ queryKey: ['pitch-comments', id] });
    queryClient.invalidateQueries({ queryKey: ['pitch', id] });
  };

  const handleLike = async () => {
    await base44.entities.ProjectPitch.update(id, { likes_count: (pitch.likes_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['pitch', id] });
  };

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
  );

  if (!pitch) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Pitch not found.</p>
      <Link to="/pitches" className="text-purple-600 hover:underline mt-2 inline-block">← Back to Pitches</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/pitches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Pitches
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-amber-50 text-amber-700 border-0">{pitch.category}</Badge>
          <Badge variant="outline" className={`text-xs ${pitch.status === 'recruiting' ? 'text-green-600 border-green-200' : ''}`}>
            {pitch.status || 'recruiting'}
          </Badge>
        </div>

        <h1 className="text-2xl font-bold font-display mb-2">{pitch.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{pitch.description}</p>

        {pitch.skills_needed?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Skills Needed</p>
            <div className="flex flex-wrap gap-2">
              {pitch.skills_needed.map(s => (
                <Badge key={s} variant="secondary" className="bg-purple-50 text-purple-700 border-0">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {pitch.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {pitch.tags.map(t => (
              <span key={t} className="text-xs text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg-subtle flex items-center justify-center text-sm font-bold text-purple-600">
              {pitch.author_display_name?.[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-sm">{pitch.author_display_name}</span>
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users size={14} /> {pitch.current_members || 1}/{pitch.team_size || '?'} members
          </span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={handleLike}>
            <Heart size={14} className="mr-1" /> {pitch.likes_count || 0}
          </Button>
        </div>
      </motion.div>

      {/* Comments */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <MessageSquare size={18} /> Comments ({comments.length})
        </h2>

        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {c.author_display_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.author_display_name}</span>
                    {c.reaction && <span>{c.reaction}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            {REACTIONS.map(r => (
              <button
                key={r}
                onClick={() => setSelectedReaction(selectedReaction === r ? '' : r)}
                className={`text-lg p-1 rounded-lg transition-all ${selectedReaction === r ? 'bg-purple-100 scale-110' : 'hover:bg-muted'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="rounded-xl"
            />
            <Button size="icon" className="gradient-bg text-white border-0 shrink-0 self-end" onClick={handleComment} disabled={!comment.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}