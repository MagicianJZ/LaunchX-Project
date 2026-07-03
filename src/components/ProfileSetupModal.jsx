import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Sparkles } from 'lucide-react';

const INTEREST_SUGGESTIONS = [
  'Robotics', 'AI/ML', 'Web Development', 'App Development', 'Data Science',
  'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Engineering',
  'Debate', 'Model UN', 'Creative Writing', 'Film', 'Photography',
  'Music', 'Art', 'Design', 'Entrepreneurship', 'Social Justice',
  'Environmental Science', 'Astronomy', 'Psychology', 'Economics', 'History'
];

const LOOKING_FOR_OPTIONS = [
  'Study partners', 'Project collaborators', 'Hackathon teammates',
  'Research partners', 'Club members', 'Mentors', 'Friends with shared interests',
  'Nonprofit co-founders', 'Competition partners', 'College advice'
];

export default function ProfileSetupModal({ open, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    display_name: '',
    full_name: '',
    school: '',
    grade: '',
    bio: '',
    interests: [],
    clubs: [],
    skills: [],
    looking_for: [],
    location: '',
    availability: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addTag = (field, value) => {
    if (value && !form[field].includes(value)) {
      setForm(prev => ({ ...prev, [field]: [...prev[field], value] }));
    }
    setTagInput('');
  };

  const removeTag = (field, value) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter(t => t !== value) }));
  };

  const handleComplete = async () => {
    setSaving(true);
    await onComplete({ ...form, profile_complete: true, last_active: new Date().toISOString() });
    setSaving(false);
  };

  const steps = [
    // Step 0: Basics
    <div key="basics" className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3">
          <Sparkles className="text-white" size={28} />
        </div>
        <h3 className="text-lg font-semibold">Welcome to NexusEd!</h3>
        <p className="text-sm text-muted-foreground">Let's set up your profile so others can find you.</p>
      </div>
      <div>
        <Label>Display Name *</Label>
        <Input placeholder="How you want to appear" value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} />
      </div>
      <div>
        <Label>Full Name (private until connected)</Label>
        <Input placeholder="Your real name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
      </div>
      <div>
        <Label>Grade *</Label>
        <Select value={form.grade} onValueChange={v => setForm(p => ({ ...p, grade: v }))}>
          <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
          <SelectContent>
            {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>School (private until connected)</Label>
        <Input placeholder="Your school name" value={form.school} onChange={e => setForm(p => ({ ...p, school: e.target.value }))} />
      </div>
      <div>
        <Label>Location (private until connected)</Label>
        <Input placeholder="City, State" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
      </div>
    </div>,

    // Step 1: Interests
    <div key="interests" className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">What are you into?</h3>
        <p className="text-sm text-muted-foreground">Pick your interests so we can match you with like-minded students.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_SUGGESTIONS.map(interest => (
          <button
            key={interest}
            onClick={() => form.interests.includes(interest) ? removeTag('interests', interest) : addTag('interests', interest)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              form.interests.includes(interest)
                ? 'gradient-bg text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add custom interest..."
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('interests', tagInput))}
        />
        <Button size="icon" variant="outline" onClick={() => addTag('interests', tagInput)}><Plus size={16} /></Button>
      </div>
    </div>,

    // Step 2: Looking for + Bio
    <div key="looking" className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">What are you looking for?</h3>
        <p className="text-sm text-muted-foreground">Help us understand what you need.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {LOOKING_FOR_OPTIONS.map(option => (
          <button
            key={option}
            onClick={() => form.looking_for.includes(option) ? removeTag('looking_for', option) : addTag('looking_for', option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              form.looking_for.includes(option)
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea
          placeholder="Tell others about yourself, your passions, what drives you..."
          value={form.bio}
          onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
          rows={3}
        />
      </div>
      <div>
        <Label>Availability</Label>
        <Input placeholder="e.g. Weekends, After 4pm" value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} />
      </div>
    </div>,
  ];

  const canNext = step === 0 ? form.display_name && form.grade : step === 1 ? form.interests.length > 0 : true;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="sr-only">Profile Setup</DialogTitle>
          <DialogDescription className="sr-only">Set up your student profile</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 mb-4">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'gradient-bg' : 'bg-muted'}`} />
          ))}
        </div>

        {steps[step]}

        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button>
          ) : <div />}
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext} className="gradient-bg text-white">Next</Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving} className="gradient-bg text-white">
              {saving ? 'Setting up...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
