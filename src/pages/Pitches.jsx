import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Lightbulb, Search, Users, MessageSquare, Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const CATEGORIES = ['STEM', 'Arts', 'Business', 'Social Impact', 'Research', 'Hackathon', 'Club', 'Other'];

const CATEGORY_COLORS = {
  STEM: 'bg-purple-50 text-purple-700',
  Arts: 'bg-pink-50 text-pink-700',
  Business: 'bg-blue-50 text-blue-700',
  'Social Impact': 'bg-green-50 text-green-700',
  Research: 'bg-amber-50 text-amber-700',
  Hackathon: 'bg-red-50 text-red-700',
  Club: 'bg-teal-50 text-teal-700',
  Other: 'bg-gray-50 text-gray-700',
};

export default function Pitches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', team_size: '', skills_needed: '', tags: ''
  });

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: pitches = [], isLoading } = useQuery({
    queryKey: ['pitches'],
    queryFn: () => base44.entities.ProjectPitch.list('-created_date', 50),
  });

  const filtered = pitches
    .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return p.title?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) ||
        p.tags?.some(t => t.toLowerCase().includes(s));
    });

  const handleCreate = async () => {
    await base44.entities.ProjectPitch.create({
      ...form,
      team_size: Number(form.team_size) || 5,
      skills_needed: form.skills_needed ? form.skills_needed.split(',').map(s => s.trim()) : [],
      tags: form.tags ? form.tags.split(',').map(s => s.trim()) : [],
      author_display_name: myProfile?.display_name || 'Anonymous',
      current_members: 1,
      likes_count: 0,
      comments_count: 0,
    });
    setDialogOpen(false);
    setForm({ title: '', description: '', category: '', team_size: '', skills_needed: '', tags: '' });
    queryClient.invalidateQueries({ queryKey: ['pitches'] });
    toast({ title: 'Pitch created!', description: 'Your project pitch is now live.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Lightbulb size={24} className="text-amber-500" />
            Project Pitches
          </h1>
          <p className="text-muted-foreground mt-1">Share ideas, find collaborators, build something amazing.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-white border-0 rounded-xl">
              <Plus size={16} className="mr-1.5" /> New Pitch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a Project Pitch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Title *</Label>
                <Input placeholder="Your project name" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea placeholder="What's the project about? What problem does it solve?" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Team Size</Label>
                <Input type="number" placeholder="5" value={form.team_size} onChange={e => setForm(p => ({ ...p, team_size: e.target.value }))} />
              </div>
              <div>
                <Label>Skills Needed (comma separated)</Label>
                <Input placeholder="Python, Design, Marketing" value={form.skills_needed} onChange={e => setForm(p => ({ ...p, skills_needed: e.target.value }))} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input placeholder="hackathon, AI, sustainability" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <Button className="w-full gradient-bg text-white border-0" onClick={handleCreate} disabled={!form.title || !form.description || !form.category}>
                Post Pitch
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search pitches..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No pitches yet. Be the first to post one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((pitch, i) => (
            <motion.div key={pitch.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/pitches/${pitch.id}`} className="block bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                <div className="flex items-start justify-between">
                  <Badge className={`${CATEGORY_COLORS[pitch.category] || 'bg-gray-50 text-gray-700'} border-0 text-xs`}>
                    {pitch.category}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${pitch.status === 'recruiting' ? 'text-green-600 border-green-200' : 'text-muted-foreground'}`}>
                    {pitch.status || 'recruiting'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mt-3 mb-1">{pitch.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{pitch.description}</p>
                {pitch.skills_needed?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {pitch.skills_needed.slice(0, 4).map(s => (
                      <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{pitch.author_display_name}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {pitch.current_members || 1}/{pitch.team_size || '?'}</span>
                  <span className="flex items-center gap-1"><Heart size={12} /> {pitch.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} /> {pitch.comments_count || 0}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}