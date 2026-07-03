import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StudentCard from '@/components/StudentCard';
import AIRecommendations from '@/components/AIRecommendations';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Discover() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [interestFilter, setInterestFilter] = useState('all');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-created_date', 50),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['my-connections', me?.id],
    queryFn: async () => {
      if (!me?.id) return [];
      const sent = await base44.entities.Connection.filter({ from_user_id: me.id });
      const received = await base44.entities.Connection.filter({ to_user_id: me.id });
      return [...sent, ...received];
    },
    enabled: !!me?.id,
  });

  const allInterests = [...new Set(allProfiles.flatMap(p => p.interests || []))].sort();

  const filtered = allProfiles
    .filter(p => p.created_by_id !== me?.id)
    .filter(p => {
      if (search) {
        const s = search.toLowerCase();
        return (
          p.display_name?.toLowerCase().includes(s) ||
          p.bio?.toLowerCase().includes(s) ||
          p.interests?.some(i => i.toLowerCase().includes(s)) ||
          p.skills?.some(i => i.toLowerCase().includes(s))
        );
      }
      return true;
    })
    .filter(p => gradeFilter === 'all' || p.grade === gradeFilter)
    .filter(p => interestFilter === 'all' || p.interests?.includes(interestFilter));

  // Sort: shared interests first
  const sorted = [...filtered].sort((a, b) => {
    if (!myProfile?.interests) return 0;
    const aShared = (a.interests || []).filter(i => myProfile.interests.includes(i)).length;
    const bShared = (b.interests || []).filter(i => myProfile.interests.includes(i)).length;
    return bShared - aShared;
  });

  const getConnectionStatus = (profile) => {
    const conn = connections.find(c =>
      (c.from_user_id === me?.id && c.to_user_id === profile.created_by_id) ||
      (c.to_user_id === me?.id && c.from_user_id === profile.created_by_id)
    );
    return conn?.status || null;
  };

  const handleConnect = async (profile) => {
    await base44.entities.Connection.create({
      from_user_id: me.id,
      to_user_id: profile.created_by_id,
      from_display_name: myProfile?.display_name || 'User',
      to_display_name: profile.display_name,
      status: 'pending',
    });
    queryClient.invalidateQueries({ queryKey: ['my-connections'] });
    toast({ title: 'Request sent!', description: `Connection request sent to ${profile.display_name}` });
  };

  const handleMessage = (profile) => {
    navigate('/messages', { state: { startChatWith: profile } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Sparkles size={24} className="text-purple-500" />
          Discover Students
        </h1>
        <p className="text-muted-foreground mt-1">Find like-minded students to connect with.</p>
      </div>

      {/* AI Recommendations */}
      <AIRecommendations
        myProfile={myProfile}
        candidates={filtered}
        getConnectionStatus={getConnectionStatus}
        onConnect={handleConnect}
        onMessage={handleMessage}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, interest, skill..."
            className="pl-9 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={interestFilter} onValueChange={setInterestFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl">
            <SelectValue placeholder="Interest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Interests</SelectItem>
            {allInterests.map(i => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No students found matching your search.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(profile => (
            <StudentCard
              key={profile.id}
              profile={profile}
              isConnected={getConnectionStatus(profile) === 'accepted'}
              connectionStatus={getConnectionStatus(profile)}
              onConnect={handleConnect}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}