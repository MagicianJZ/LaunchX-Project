import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Search, Loader2, UserPlus, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const CATEGORIES = ['STEM', 'Arts', 'Business', 'Social Impact', 'Sports', 'Academic', 'Other'];

const CATEGORY_ICONS = {
  STEM: '🔬', Arts: '🎨', Business: '💼', 'Social Impact': '🌍', Sports: '⚽', Academic: '📚', Other: '🎯',
};

export default function Communities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', tags: '' });

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-created_date', 50),
  });

  const filtered = communities
    .filter(c => categoryFilter === 'all' || c.category === categoryFilter)
    .filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return c.name?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s);
    });

  const handleCreate = async () => {
    await base44.entities.Community.create({
      ...form,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()) : [],
      members: [me.id],
      member_count: 1,
      icon: CATEGORY_ICONS[form.category] || '🎯',
    });
    setDialogOpen(false);
    setForm({ name: '', description: '', category: '', tags: '' });
    queryClient.invalidateQueries({ queryKey: ['communities'] });
    toast({ title: 'Community created!', description: 'Invite others to join.' });
  };

  const handleJoin = async (community) => {
    const members = community.members || [];
    if (members.includes(me.id)) return;
    await base44.entities.Community.update(community.id, {
      members: [...members, me.id],
      member_count: (community.member_count || 0) + 1,
    });
    queryClient.invalidateQueries({ queryKey: ['communities'] });
    toast({ title: 'Joined!', description: `You're now a member of ${community.name}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Users size={24} className="text-teal-500" />
            Communities
          </h1>
          <p className="text-muted-foreground mt-1">Join interest-based groups and connect with peers.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-white border-0 rounded-xl">
              <Plus size={16} className="mr-1.5" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Name *</Label>
                <Input placeholder="e.g. Robotics Enthusiasts" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea placeholder="What is this community about?" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
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
                <Label>Tags (comma separated)</Label>
                <Input placeholder="coding, AI, beginner-friendly" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <Button className="w-full gradient-bg text-white border-0" onClick={handleCreate} disabled={!form.name || !form.description || !form.category}>
                Create Community
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search communities..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
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
          <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No communities yet. Create the first one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((community, i) => {
            const isMember = community.members?.includes(me?.id);
            return (
              <motion.div key={community.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                    {community.icon || '🎯'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{community.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">{community.category}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{community.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={12} /> {community.member_count || 0} members
                  </span>
                  {isMember ? (
                    <Button size="sm" variant="outline" disabled className="rounded-xl">
                      <Check size={14} className="mr-1" /> Joined
                    </Button>
                  ) : (
                    <Button size="sm" className="gradient-bg text-white border-0 rounded-xl" onClick={() => handleJoin(community)}>
                      <UserPlus size={14} className="mr-1" /> Join
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