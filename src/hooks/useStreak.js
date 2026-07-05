import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Tracks the user's daily streak. On mount:
 * - If last_active was yesterday → increment streak
 * - If last_active was today → no change
 * - If last_active was 2+ days ago or never → reset to 1
 */
export function useStreak() {
  const queryClient = useQueryClient();
  const updated = useRef(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', me?.id],
    queryFn: async () => {
      if (!me?.id) return null;
      const profiles = await base44.entities.StudentProfile.filter({ created_by_id: me.id });
      return profiles[0] || null;
    },
    enabled: !!me?.id,
  });

  useEffect(() => {
    if (updated.current || !me?.id || !myProfile?.id) return;
    updated.current = true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActive = myProfile.last_active ? new Date(myProfile.last_active) : null;
    const lastActiveDay = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;

    let newStreak = myProfile.streak_days || 0;

    if (!lastActiveDay) {
      newStreak = 1;
    } else {
      const diffDays = Math.round((today - lastActiveDay) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return; // already tracked today
      if (diffDays === 1) newStreak = (myProfile.streak_days || 0) + 1;
      else newStreak = 1; // gap > 1 day, reset
    }

    base44.entities.StudentProfile.update(myProfile.id, {
      streak_days: newStreak,
      last_active: now.toISOString(),
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    });
  }, [me?.id, myProfile?.id, queryClient]);
}