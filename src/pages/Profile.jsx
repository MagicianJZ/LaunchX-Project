import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Bell, Shield, Check, X, LogOut, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagField, setTagField] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myProfile, isLoading } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests', me?.id],
    queryFn: async () => {
      const all = await base44.entities.Connection.filter({ to_user_id: me.id, status: 'pending' });
      return all.filter(c => c.from_user_id !== me.id);
    },
    enabled: !!me?.id,
  });

  const { data: myConnections = [] } = useQuery({
    queryKey: ['my-accepted-connections', me?.id],
    queryFn: async () => {
      const sent = await base44.entities.Connection.filter({ from_user_id: me.id, status: 'accepted' });
      const received = await base44.entities.Connection.filter({ to_user_id: me.id, status: 'accepted' });
      return [...sent, ...received];
    },
    enabled: !!me?.id,
  });

  const [form, setForm] = useState(null);

  const startEditing = () => {
    setForm({ ...myProfile });
    setEditing(true);
  };

  const saveProfile = async () => {
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    await base44.entities.StudentProfile.update(myProfile.id, data);
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    toast({ title: 'Profile updated!' });
  };

  const handleConnection = async (conn, action) => {
    await base44.entities.Connection.update(conn.id, { status: action });
    queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    queryClient.invalidateQueries({ queryKey: ['my-accepted-connections'] });
    queryClient.invalidateQueries({ queryKey: ['pending-connections-count'] });
    toast({ title: action === 'accepted' ? 'Connection accepted!' : 'Connection declined.' });
  };

  const addTag = (field) => {
    if (tagInput && form && !form[field]?.includes(tagInput)) {
      setForm(p => ({ ...p, [field]: [...(p[field] || []), tagInput] }));
    }
    setTagInput('');
    setTagField('');
  };

  const removeTag = (field, value) => {
    setForm(p => ({ ...p, [field]: (p[field] || []).filter(t => t !== value) }));
  };

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1">
          <TabsTrigger value="profile" className="rounded-lg"><User size={14} className="mr-1.5" /> Profile</TabsTrigger>
          <TabsTrigger value="connections" className="rounded-lg relative">
            <Bell size={14} className="mr-1.5" /> Connections
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg"><Settings size={14} className="mr-1.5" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {myProfile && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 lg:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-2xl font-bold text-white">
                    {myProfile.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{myProfile.display_name}</h2>
                    <p className="text-sm text-muted-foreground">{myProfile.grade} · {myConnections.length} connections</p>
                  </div>
                </div>
                {!editing ? (
                  <Button variant="outline" onClick={startEditing} className="rounded-xl">Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={saveProfile} className="gradient-bg text-white border-0 rounded-xl">Save</Button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input value={form.display_name || ''} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Grade</Label>
                      <Select value={form.grade || ''} onValueChange={v => setForm(p => ({ ...p, grade: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} />
                  </div>
                  <div>
                    <Label>Full Name (private)</Label>
                    <Input value={form.full_name || ''} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>School (private)</Label>
                    <Input value={form.school || ''} onChange={e => setForm(p => ({ ...p, school: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Location (private)</Label>
                    <Input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  {['interests', 'skills', 'clubs', 'looking_for'].map(field => (
                    <div key={field}>
                      <Label className="capitalize">{field.replace(/_/g, ' ')}</Label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(form[field] || []).map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button onClick={() => removeTag(field, tag)}><X size={12} /></button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Add ${field.replace(/_/g, ' ')}...`}
                          value={tagField === field ? tagInput : ''}
                          onFocus={() => setTagField(field)}
                          onChange={e => { setTagField(field); setTagInput(e.target.value); }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(field))}
                        />
                        <Button size="icon" variant="outline" onClick={() => { setTagField(field); addTag(field); }}>
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {myProfile.bio && <p className="text-muted-foreground">{myProfile.bio}</p>}
                  {myProfile.badges?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1.5">Badges</p>
                      <div className="flex flex-wrap gap-1.5">
                        {myProfile.badges.map(badge => (
                          <Badge key={badge} variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-0">{badge}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {['interests', 'skills', 'clubs', 'looking_for'].map(field => (
                    myProfile[field]?.length > 0 && (
                      <div key={field}>
                        <p className="text-sm font-medium mb-1.5 capitalize">{field.replace(/_/g, ' ')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {myProfile[field].map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                  {myProfile.availability && (
                    <div>
                      <p className="text-sm font-medium mb-1">Availability</p>
                      <p className="text-sm text-muted-foreground">{myProfile.availability}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-6 space-y-4">
          {pendingRequests.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold mb-4">Pending Requests ({pendingRequests.length})</h3>
              <div className="space-y-3">
                {pendingRequests.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-bg-subtle flex items-center justify-center text-sm font-bold text-purple-600">
                        {conn.from_display_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium">{conn.from_display_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-bg text-white border-0 rounded-xl" onClick={() => handleConnection(conn, 'accepted')}>
                        <Check size={14} className="mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleConnection(conn, 'declined')}>
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">My Connections ({myConnections.length})</h3>
            {myConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No connections yet. Start discovering students!</p>
            ) : (
              <div className="space-y-3">
                {myConnections.map(conn => {
                  const name = conn.from_user_id === me?.id ? conn.to_display_name : conn.from_display_name;
                  return (
                    <div key={conn.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl gradient-bg-subtle flex items-center justify-center text-sm font-bold text-purple-600">
                        {name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Shield size={18} /> Privacy Settings
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'privacy_show_name', label: 'Show real name to everyone', desc: 'Otherwise only visible to connections' },
                  { key: 'privacy_show_school', label: 'Show school to everyone', desc: 'Otherwise only visible to connections' },
                  { key: 'privacy_show_location', label: 'Show location to everyone', desc: 'Otherwise only visible to connections' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={myProfile?.[key] || false}
                      onCheckedChange={async (v) => {
                        await base44.entities.StudentProfile.update(myProfile.id, { [key]: v });
                        queryClient.invalidateQueries({ queryKey: ['my-profile'] });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => base44.auth.logout('/')}>
                <LogOut size={14} className="mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}