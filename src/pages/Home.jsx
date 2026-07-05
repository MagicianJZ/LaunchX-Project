import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import StudentCard from '@/components/StudentCard';
import AIRecommendations from '@/components/AIRecommendations';
import { useStreak } from '@/hooks/useStreak';
import { Search, Lightbulb, Briefcase, Megaphone, ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { recalculateBadges } from '@/lib/badges';

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  useStreak();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      if (!me?.id) return null;
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  const { data: recommended = [] } = useQuery({
    queryKey: ['recommended-students', myProfile?.id],
    queryFn: async () => {
      const all = await base44.entities.StudentProfile.list('-created_date', 50);
      return all.filter(p => p.created_by_id !== me?.id).slice(0, 20);
    },
    enabled: !!me?.id,
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

  const { data: recentPitches = [] } = useQuery({
    queryKey: ['recent-pitches'],
    queryFn: () => base44.entities.ProjectPitch.list('-created_date', 3),
  });

  const { data: recentOpps = [] } = useQuery({
    queryKey: ['recent-opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 3),
  });

  useEffect(() => {
    if (me && myProfile === null) {
      setShowSetup(true);
    }
  }, [me, myProfile]);

  useEffect(() => {
    if (me) recalculateBadges(me);
  }, [me]);

  const handleProfileComplete = async (data) => {
    await base44.entities.StudentProfile.create(data);
    setShowSetup(false);
    refetchProfile();
    toast({ title: 'Profile created!', description: 'Welcome to NexusEd 🎉' });
  };

  const handleConnect = async (profile) => {
    await base44.entities.Connection.create({
      from_user_id: me.id,
      from_profile_id: myProfile?.id,
      to_user_id: profile.created_by_id,
      to_profile_id: profile.id,
      from_display_name: myProfile?.display_name || 'User',
      to_display_name: profile.display_name,
      status: 'pending',
    });
    queryClient.invalidateQueries({ queryKey: ['my-connections'] });
    if (me) await recalculateBadges(me);
    toast({ title: 'Request sent!', description: `Connection request sent to ${profile.display_name}` });
  };

  const getConnectionStatus = (profile) => {
    const conn = connections.find(c =>
      (c.from_user_id === me?.id && c.to_profile_id === profile.id) ||
      (c.to_user_id === me?.id && c.from_profile_id === profile.id)
    );
    return conn?.status || null;
  };

  const acceptedCount = connections.filter(c => c.status === 'accepted').length;

  const quickLinks = [
    { icon: Search, label: 'Find Students', path: '/discover', color: 'bg-purple-50 text-purple-600' },
    { icon: Lightbulb, label: 'Project Pitches', path: '/pitches', color: 'bg-amber-50 text-amber-600' },
    { icon: Briefcase, label: 'Opportunities', path: '/opportunities', color: 'bg-blue-50 text-blue-600' },
    { icon: Megaphone, label: 'Updates', path: '/updates', color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div className="space-y-8">
      <ProfileSetupModal open={showSetup} onComplete={handleProfileComplete} />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-bg p-8 lg:p-10 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-4 left-12 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
            <Sparkles size={16} />
            <span>Your Student Network</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-2">
            {myProfile ? `Hey, ${myProfile.display_name} 👋` : 'Welcome to NexusEd'}
          </h1>
          <p className="text-white/80 max-w-lg">
            Connect with like-minded students, find project collaborators, and discover exciting opportunities.
          </p>
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{acceptedCount}</p>
              <p className="text-xs text-white/70">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{myProfile?.interests?.length || 0}</p>
              <p className="text-xs text-white/70">Interests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{myProfile?.streak_days || 0}</p>
              <p className="text-xs text-white/70">Day Streak</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(({ icon: Icon, label, path, color }, i) => (
          <motion.div key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={path} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={20} />
              </div>
              <span className="font-medium text-sm">{label}</span>
              <ArrowRight size={14} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations */}
      {myProfile && recommended.length > 0 && (
        <AIRecommendations
          myProfile={myProfile}
          candidates={recommended}
          getConnectionStatus={getConnectionStatus}
          onConnect={handleConnect}
        />
      )}

      {/* Recent Pitches */}
      {recentPitches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold font-display">Latest Project Pitches</h2>
            </div>
            <Link to="/pitches" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentPitches.map(pitch => (
              <Link key={pitch.id} to={`/pitches/${pitch.id}`} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                <Badge className="mb-2 bg-amber-50 text-amber-700 border-0 text-xs" variant="secondary">{pitch.category}</Badge>
                <h3 className="font-semibold mb-1 line-clamp-1">{pitch.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{pitch.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{pitch.author_display_name}</span>
                  <span>·</span>
                  <span>{pitch.current_members || 1}/{pitch.team_size || '?'} members</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Opportunities */}
      {recentOpps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              <h2 className="text-lg font-semibold font-display">New Opportunities</h2>
            </div>
            <Link to="/opportunities" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentOpps.map(opp => (
              <Link key={opp.id} to="/opportunities" className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
                <Badge className="mb-2 bg-blue-50 text-blue-700 border-0 text-xs" variant="secondary">{opp.type}</Badge>
                <h3 className="font-semibold mb-1 line-clamp-1">{opp.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>
                {opp.deadline && (
                  <p className="text-xs text-muted-foreground mt-2">Deadline: {new Date(opp.deadline).toLocaleDateString()}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}