import { base44 } from '@/api/base44Client';

const BADGE_DEFS = [
  { id: '🎯 First Pitch', condition: (c) => c.pitches >= 1 },
  { id: '💡 Idea Machine', condition: (c) => c.pitches >= 3 },
  { id: '💬 First Comment', condition: (c) => c.comments >= 1 },
  { id: '🗣️ Conversationalist', condition: (c) => c.comments >= 5 },
  { id: '🤝 First Connection', condition: (c) => c.connections >= 1 },
  { id: '🌐 Networker', condition: (c) => c.connections >= 5 },
  { id: '📌 Opportunity Sharer', condition: (c) => c.opportunities >= 1 },
  { id: '📢 Opportunity Hub', condition: (c) => c.opportunities >= 3 },
  { id: '✨ First Update', condition: (c) => c.updates >= 1 },
  { id: '🔥 Consistent', condition: (c) => c.streak >= 7 },
];

export async function recalculateBadges(me) {
  if (!me?.id) return [];

  const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
  const myProfile = profiles[0];
  if (!myProfile) return [];

  const [pitches, comments, sentConns, receivedConns, opportunities, updates] = await Promise.all([
    base44.entities.ProjectPitch.filter({ created_by_id: me.id }),
    base44.entities.PitchComment.filter({ created_by_id: me.id }),
    base44.entities.Connection.filter({ from_user_id: me.id, status: 'accepted' }),
    base44.entities.Connection.filter({ to_user_id: me.id, status: 'accepted' }),
    base44.entities.Opportunity.filter({ created_by_id: me.id }),
    base44.entities.ProjectUpdate.filter({ created_by_id: me.id }),
  ]);

  const counts = {
    pitches: pitches.length,
    comments: comments.length,
    connections: sentConns.length + receivedConns.length,
    opportunities: opportunities.length,
    updates: updates.length,
    streak: myProfile.streak_days || 0,
  };

  const earnedBadges = BADGE_DEFS.filter(b => b.condition(counts)).map(b => b.id);
  const currentBadges = myProfile.badges || [];

  const hasNew = earnedBadges.some(b => !currentBadges.includes(b));
  if (hasNew) {
    await base44.entities.StudentProfile.update(myProfile.id, { badges: earnedBadges });
  }

  return earnedBadges;
}