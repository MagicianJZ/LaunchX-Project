import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageCircle, MapPin, School, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentCard({ profile = {}, isConnected, onConnect, onMessage, connectionStatus }) {
  const showPrivate = isConnected;
  const displayName = profile.display_name || 'Student';
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const lookingFor = Array.isArray(profile.looking_for) ? profile.looking_for : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-bg-subtle flex items-center justify-center text-lg font-bold text-purple-600 shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full rounded-xl object-cover" />
          ) : (
            displayName[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
            {showPrivate && profile.full_name && (
              <span className="text-xs text-muted-foreground">({profile.full_name})</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {profile.grade && <span className="font-medium">{profile.grade}</span>}
            {showPrivate && profile.school && (
              <span className="flex items-center gap-1"><School size={12} />{profile.school}</span>
            )}
            {showPrivate && profile.location && (
              <span className="flex items-center gap-1"><MapPin size={12} />{profile.location}</span>
            )}
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{profile.bio}</p>
      )}

      {interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {interests.slice(0, 5).map(interest => (
            <Badge key={interest} variant="secondary" className="text-xs font-normal bg-purple-50 text-purple-700 border-0">
              {interest}
            </Badge>
          ))}
          {interests.length > 5 && (
            <Badge variant="secondary" className="text-xs font-normal">+{interests.length - 5}</Badge>
          )}
        </div>
      )}

      {lookingFor.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {lookingFor.slice(0, 3).map(item => (
            <Badge key={item} variant="outline" className="text-xs font-normal text-teal-600 border-teal-200">
              {item}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {isConnected ? (
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onMessage?.(profile)}>
            <MessageCircle size={14} className="mr-1.5" /> Message
          </Button>
        ) : connectionStatus === 'pending' ? (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            <Clock size={14} className="mr-1.5" /> Pending
          </Button>
        ) : (
          <Button size="sm" className="flex-1 gradient-bg text-white border-0" onClick={() => onConnect?.(profile)}>
            <UserPlus size={14} className="mr-1.5" /> Connect
          </Button>
        )}
      </div>
    </motion.div>
  );
}