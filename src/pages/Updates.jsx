import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Heart, MessageSquare, Loader2, ExternalLink, Trash2, Pencil, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { recalculateBadges } from '@/lib/badges';
import EditPostDialog from '@/components/EditPostDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Updates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ content: '', link: '', link_title: '' });
  const [imageFile, setImageFile] = useState(null);
  const [posting, setPosting] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['updates'],
    queryFn: () => base44.entities.ProjectUpdate.list('-created_date', 50),
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ['update-comments'],
    queryFn: () => base44.entities.UpdateComment.list('-created_date', 200),
  });

  const commentsByUpdate = allComments.reduce((acc, c) => {
    if (!acc[c.update_id]) acc[c.update_id] = [];
    acc[c.update_id].push(c);
    return acc;
  }, {});

  const handleCreate = async () => {
    if (!form.content.trim()) return;
    setPosting(true);
    let image_url = '';
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = file_url;
    }
    await base44.entities.ProjectUpdate.create({
      content: form.content,
      image_url,
      link: form.link,
      link_title: form.link_title || form.link,
      author_display_name: myProfile?.display_name || 'Anonymous',
      likes_count: 0,
      comments_count: 0,
    });
    setPosting(false);
    setDialogOpen(false);
    setForm({ content: '', link: '', link_title: '' });
    setImageFile(null);
    queryClient.invalidateQueries({ queryKey: ['updates'] });
    if (me) await recalculateBadges(me);
    toast({ title: 'Update posted!' });
  };

  const handleLike = async (update) => {
    await base44.entities.ProjectUpdate.update(update.id, { likes_count: (update.likes_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['updates'] });
  };

  const handleEditSave = async (data) => {
    const { id, created_date, updated_date, created_by_id, ...updateData } = data;
    await base44.entities.ProjectUpdate.update(editPost.id, updateData);
    setEditPost(null);
    queryClient.invalidateQueries({ queryKey: ['updates'] });
    toast({ title: 'Update edited!' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await base44.entities.ProjectUpdate.delete(deleteTarget.id);
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ['updates'] });
    toast({ title: 'Update deleted' });
  };

  const handleComment = async (updateId) => {
    const text = (commentInputs[updateId] || '').trim();
    if (!text) return;
    await base44.entities.UpdateComment.create({
      update_id: updateId,
      content: text,
      author_display_name: myProfile?.display_name || 'Anonymous',
    });
    const update = updates.find(u => u.id === updateId);
    if (update) {
      await base44.entities.ProjectUpdate.update(updateId, { comments_count: (update.comments_count || 0) + 1 });
    }
    setCommentInputs(p => ({ ...p, [updateId]: '' }));
    queryClient.invalidateQueries({ queryKey: ['update-comments'] });
    queryClient.invalidateQueries({ queryKey: ['updates'] });
    if (me) await recalculateBadges(me);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Megaphone size={24} className="text-purple-500" />
            Project Updates
          </h1>
          <p className="text-muted-foreground mt-1">Share what you've been working on, achievements, and cool projects.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-white border-0 rounded-xl">
              <Plus size={16} className="mr-1.5" /> Post Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share an Update</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>What did you do? *</Label>
                <Textarea placeholder="Built a weather app, won a hackathon, published research..." rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>
              <div>
                <Label>Add a Photo</Label>
                <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <Label>Link (optional)</Label>
                <Input placeholder="https://..." value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />
              </div>
              {form.link && (
                <div>
                  <Label>Link Title (optional)</Label>
                  <Input placeholder="My GitHub Repo, Project Demo, etc." value={form.link_title} onChange={e => setForm(p => ({ ...p, link_title: e.target.value }))} />
                </div>
              )}
              <Button className="w-full gradient-bg text-white border-0" onClick={handleCreate} disabled={!form.content.trim() || posting}>
                {posting ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Plus size={16} className="mr-1.5" />}
                {posting ? 'Posting...' : 'Post Update'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
      ) : updates.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No updates yet. Share what you've been up to!</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {updates.map((update, i) => {
            const comments = commentsByUpdate[update.id] || [];
            return (
              <motion.div key={update.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-bg-subtle flex items-center justify-center font-bold text-purple-600">
                    {update.author_display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{update.author_display_name}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(update.created_date).toLocaleDateString()}</p>
                  </div>
                  {update.created_by_id === me?.id && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditPost(update)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(update)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{update.content}</p>
                {update.image_url && (
                  <img src={update.image_url} alt="Update" className="w-full rounded-xl mt-3 max-h-96 object-cover" />
                )}
                {update.link && (
                  <a href={update.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-muted hover:bg-muted/70 transition-colors">
                    <ExternalLink size={16} className="text-purple-500" />
                    <span className="text-sm font-medium text-purple-600 truncate">{update.link_title || update.link}</span>
                  </a>
                )}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                  <button onClick={() => handleLike(update)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-pink-500 transition-colors">
                    <Heart size={14} /> {update.likes_count || 0}
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare size={14} /> {comments.length}
                  </span>
                </div>

                {/* Comments */}
                <div className="mt-3 space-y-3">
                  {comments.length > 0 && (
                    <div className="space-y-2">
                      {comments.map(c => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                            {c.author_display_name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                            <span className="text-xs font-medium">{c.author_display_name}</span>
                            <p className="text-sm text-muted-foreground">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      className="rounded-xl"
                      value={commentInputs[update.id] || ''}
                      onChange={e => setCommentInputs(p => ({ ...p, [update.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleComment(update.id)}
                    />
                    <Button size="icon" className="gradient-bg text-white border-0 shrink-0" onClick={() => handleComment(update.id)} disabled={!(commentInputs[update.id] || '').trim()}>
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <EditPostDialog
        open={!!editPost}
        onOpenChange={(v) => !v && setEditPost(null)}
        post={editPost}
        fields={['content', 'link', 'link_title']}
        onSave={handleEditSave}
        title="Edit Update"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Update?"
        description="Are you sure you want to delete this update? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}