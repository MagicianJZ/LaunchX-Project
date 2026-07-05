import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditPostDialog({ open, onOpenChange, post, fields, categories, categoryLabel, onSave, title = 'Edit Post' }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (post) setForm({ ...post });
  }, [post]);

  if (!form) return null;

  const handleSave = async () => {
    await onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {fields.includes('title') && (
            <div>
              <Label>Title</Label>
              <Input value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
          )}
          {fields.includes('name') && (
            <div>
              <Label>Name</Label>
              <Input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
          )}
          {fields.includes('description') && (
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          )}
          {fields.includes('category') && categories && (
            <div>
              <Label>{categoryLabel || 'Category'}</Label>
              <Select value={form.category || ''} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {fields.includes('organization') && (
            <div>
              <Label>Organization</Label>
              <Input value={form.organization || ''} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} />
            </div>
          )}
          {fields.includes('location') && (
            <div>
              <Label>Location</Label>
              <Input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          )}
          {fields.includes('deadline') && (
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          )}
          {fields.includes('link') && (
            <div>
              <Label>Application Link</Label>
              <Input value={form.link || ''} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />
            </div>
          )}
          {fields.includes('team_size') && (
            <div>
              <Label>Team Size</Label>
              <Input type="number" value={form.team_size || ''} onChange={e => setForm(p => ({ ...p, team_size: Number(e.target.value) }))} />
            </div>
          )}
          {fields.includes('status') && (
            <div>
              <Label>Status</Label>
              <Select value={form.status || 'recruiting'} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recruiting">Recruiting</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {fields.includes('skills_needed') && (
            <div>
              <Label>Skills Needed (comma separated)</Label>
              <Input
                value={Array.isArray(form.skills_needed) ? form.skills_needed.join(', ') : ''}
                onChange={e => setForm(p => ({ ...p, skills_needed: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              />
            </div>
          )}
          {fields.includes('tags') && (
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={Array.isArray(form.tags) ? form.tags.join(', ') : ''}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              />
            </div>
          )}
          {fields.includes('content') && (
            <div>
              <Label>Content</Label>
              <Textarea rows={4} value={form.content || ''} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
            </div>
          )}
          {fields.includes('link') && (
            <div>
              <Label>Link</Label>
              <Input value={form.link || ''} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />
            </div>
          )}
          {fields.includes('link_title') && (
            <div>
              <Label>Link Title</Label>
              <Input value={form.link_title || ''} onChange={e => setForm(p => ({ ...p, link_title: e.target.value }))} />
            </div>
          )}
          <Button className="w-full gradient-bg text-white border-0" onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}