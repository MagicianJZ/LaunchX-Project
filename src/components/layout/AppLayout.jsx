import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Lightbulb, Briefcase, MessageCircle, User, Megaphone, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/discover', icon: Search, label: 'Discover' },
  { path: '/pitches', icon: Lightbulb, label: 'Pitches' },
  { path: '/opportunities', icon: Briefcase, label: 'Opportunities' },
  { path: '/updates', icon: Megaphone, label: 'Updates' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: pendingConnections } = useQuery({
    queryKey: ['pending-connections-count'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const pending = await base44.entities.Connection.filter({ to_user_id: me.id, status: 'pending' });
      return pending.length;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-display">N</span>
              </div>
              <span className="text-xl font-bold font-display gradient-text hidden sm:block">NexusEd</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/profile'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <User size={16} />
                <span className="hidden sm:block">Profile</span>
                {pendingConnections > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {pendingConnections}
                  </span>
                )}
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}