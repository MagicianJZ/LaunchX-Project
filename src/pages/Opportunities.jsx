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
import { Switch } from '@/components/ui/switch';
import { Plus, Briefcase, Search, Calendar, MapPin, ExternalLink, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import EditPostDialog from '@/components/EditPostDialog';
import { recalculateBadges } from '@/lib/badges';
import ConfirmDialog from '@/components/ConfirmDialog';

const TYPES = ['Internship', 'Competition', 'Hackathon', 'Volunteering', 'Research', 'Job', 'Scholarship'];

const TYPE_COLORS = {
  Internship: 'bg-blue-50 text-blue-700',
  Competition: 'bg-red-50 text-red-700',
  Hackathon: 'bg-purple-50 text-purple-700',
  Volunteering: 'bg-green-50 text-green-700',
  Research: 'bg-amber-50 text-amber-700',
  Job: 'bg-indigo-50 text-indigo-700',
  Scholarship: 'bg-teal-50 text-teal-700',
};

export default function Opportunities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', type: '', organization: '', location: '',
    deadline: '', link: '', tags: '', is_remote: false,
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

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 50),
  });

  const filtered = opportunities
    .filter(o => typeFilter === 'all' || o.type === typeFilter)
    .filter(o => {
      if (!search) return true;
      const s = search.toLowerCase();
      return o.title?.toLowerCase().includes(s) || o.description?.toLowerCase().includes(s) ||
        o.organization?.toLowerCase().includes(s) || o.tags?.some(t => t.toLowerCase().includes(s));
    });

  const handleCreate = async () => {
    await base44.entities.Opportunity.create({
      ...form,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()) : [],
      posted_by_name: myProfile?.display_name || 'Anonymous',
      saves_count: 0,
    });
    setDialogOpen(false);
    setForm({ title: '', description: '', type: '', organization: '', location: '', deadline: '', link: '', tags: '', is_remote: false });
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    if (me) await recalculateBadges(me);
    toast({ title: 'Opportunity posted!', description: 'It\'s now visible to all students.' });
  };

  const handleEditSave = async (data) => {
    const { id, created_date, updated_date, created_by_id, ...updateData } = data;
    await base44.entities.Opportunity.update(editPost.id, updateData);
    setEditPost(null);
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    toast({ title: 'Opportunity updated!' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await base44.entities.Opportunity.delete(deleteTarget.id);
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    if (me) await recalculateBadges(me);
    toast({ title: 'Opportunity deleted' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Briefcase size={24} className="text-blue-500" />
            Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">Discover internships, competitions, scholarships, and more.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-white border-0 rounded-xl">
              <Plus size={16} className="mr-1.5" /> Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post an Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Title *</Label>
                <Input placeholder="e.g. NASA SEES Internship" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea placeholder="Details about the opportunity..." rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Organization</Label>
                <Input placeholder="Company or organization name" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} />
              </div>
              <div>
                <Label>Location</Label>
                <Input placeholder="City, State or Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_remote} onCheckedChange={v => setForm(p => ({ ...p, is_remote: v }))} />
                <Label>Remote / Virtual</Label>
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div>
                <Label>Application Link</Label>
                <Input placeholder="https://..." value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input placeholder="STEM, high school, paid" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <Button className="w-full gradient-bg text-white border-0" onClick={handleCreate} disabled={!form.title || !form.description || !form.type}>
                Post Opportunity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search opportunities..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No opportunities posted yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((opp, i) => (
            <motion.div key={opp.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge className={`${TYPE_COLORS[opp.type] || 'bg-gray-50 text-gray-700'} border-0 text-xs`}>{opp.type}</Badge>
                    {opp.is_remote && <Badge variant="outline" className="text-xs text-green-600 border-green-200">Remote</Badge>}
                  </div>
                  <h3 className="font-semibold text-lg">{opp.title}</h3>
                  {opp.organization && <p className="text-sm text-muted-foreground mt-0.5">{opp.organization}</p>}
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{opp.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {opp.location && <span className="flex items-center gap-1"><MapPin size={12} /> {opp.location}</span>}
                    {opp.deadline && <span className="flex items-center gap-1"><Calendar size={12} /> Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>}
                    <span>Posted by {opp.posted_by_name}</span>
                  </div>
                  {opp.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {opp.tags.map(t => <span key={t} className="text-xs text-muted-foreground">#{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {opp.link && (
                    <Button size="sm" variant="outline" className="rounded-xl" asChild>
                      <a href={opp.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} className="mr-1" /> Apply
                      </a>
                    </Button>
                  )}
                  {opp.created_by_id === me?.id && (
                    <>
                      <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditPost(opp)}>
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(opp)}>
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <EditPostDialog
        open={!!editPost}
        onOpenChange={(v) => !v && setEditPost(null)}
        post={editPost}
        fields={['title', 'description', 'organization', 'location', 'deadline', 'link', 'tags']}
        categories={null}
        onSave={handleEditSave}
        title="Edit Opportunity"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Opportunity?"
        description="Are you sure you want to delete this opportunity? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}