import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, GraduationCap, Swords, Shield, Crosshair,
  Search, Brain, Cloud, Lock, Network, Smartphone, Bug, Target, Eye,
  BookOpen, Trophy, Briefcase, User, CheckCircle, Rocket, Globe, Image,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { onboardingService } from '../services/onboardingService';

const STEPS = [
  { id: 'welcome', title: 'Welcome to CyberForge' },
  { id: 'skill', title: 'Your Skill Level' },
  { id: 'team', title: 'Team Interest' },
  { id: 'focus', title: 'Focus Areas' },
  { id: 'purpose', title: 'Your Purpose' },
  { id: 'experience', title: 'Your Background' },
];

const SKILL_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to cybersecurity & CTFs', icon: BookOpen, color: 'var(--diff-easy)' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, want to grow', icon: Target, color: 'var(--accent-yellow)' },
  { value: 'advanced', label: 'Advanced', desc: 'Experienced hacker & competitor', icon: Crosshair, color: 'var(--diff-hard)' },
];

const TEAM_OPTIONS = [
  { value: 'red', label: 'Red Team', desc: 'Offensive security, pen testing, exploitation', icon: Swords, color: '#ef4444' },
  { value: 'blue', label: 'Blue Team', desc: 'Defensive security, SOC, incident response', icon: Shield, color: '#3b82f6' },
  { value: 'both', label: 'Both Teams', desc: 'Full spectrum cybersecurity', icon: Bug, color: 'var(--accent-purple)' },
  { value: 'not_sure', label: 'Not Sure Yet', desc: 'Still exploring options', icon: Search, color: 'var(--accent-cyan)' },
];

const FOCUS_OPTIONS = [
  { value: 'Web Exploitation', label: 'Web Security', icon: Globe, color: '#3b82f6' },
  { value: 'Cryptography', label: 'Cryptography', icon: Lock, color: '#8b5cf6' },
  { value: 'Reverse Engineering', label: 'Reverse Engineering', icon: Brain, color: '#f59e0b' },
  { value: 'Digital Forensics', label: 'Digital Forensics', icon: Search, color: '#10b981' },
  { value: 'OSINT', label: 'OSINT', icon: Eye, color: '#06b6d4' },
  { value: 'Networking', label: 'Networking', icon: Network, color: '#f97316' },
  { value: 'Binary Exploitation', label: 'Binary Exploitation', icon: Target, color: '#ef4444' },
  { value: 'Mobile Security', label: 'Mobile Security', icon: Smartphone, color: '#ec4899' },
  { value: 'Steganography', label: 'Steganography', icon: Image, color: '#84cc16' },
];

const PURPOSE_OPTIONS = [
  { value: 'practice', label: 'Practice & Learn', desc: 'Hands-on learning through challenges', icon: GraduationCap, color: 'var(--diff-easy)' },
  { value: 'improve', label: 'Improve Skills', desc: 'Level up existing cybersecurity skills', icon: Rocket, color: 'var(--accent-cyan)' },
  { value: 'competitive', label: 'Competitive CTF', desc: 'Compete in CTF events & rank high', icon: Trophy, color: 'var(--accent-yellow)' },
  { value: 'career', label: 'Career Growth', desc: 'Build skills for a security career', icon: Briefcase, color: 'var(--accent-purple)' },
  { value: 'academic', label: 'Academic', desc: 'University coursework & research', icon: BookOpen, color: 'var(--accent-green)' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'student', label: 'Student', desc: 'Currently studying', icon: GraduationCap, color: 'var(--accent-cyan)' },
  { value: 'professional', label: 'Working Professional', desc: 'Employed in tech/security', icon: Briefcase, color: 'var(--accent-green)' },
  { value: 'researcher', label: 'Researcher', desc: 'Academic or independent research', icon: Brain, color: 'var(--accent-purple)' },
  { value: 'self_learner', label: 'Self-Learner', desc: 'Learning independently', icon: BookOpen, color: 'var(--accent-yellow)' },
];

function WelcomeStep({ onNext }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 100, height: 100, margin: '0 auto 24px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(116,100,220,0.15) 0%, rgba(116,100,220,0.05) 100%)',
        border: '2px solid var(--accent-green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--glow-green)',
      }}>
        <Shield size={48} color="var(--accent-green)" />
      </div>
      <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-green)', marginBottom: 12 }}>
        Welcome, Hacker!
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
        Let's personalize your CyberForge experience. A few quick questions to tailor
        challenges and features to your goals.
      </p>
      <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={onNext}
        style={{ padding: '14px 32px', fontSize: '0.95rem' }}>
        Get Started <ChevronRight size={18} />
      </button>
    </div>
  );
}

function SelectionStep({ options, selected, onToggle, multi = false, title, subtitle }) {
  return (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{subtitle}</p>
      </div>
      <div className="row g-3 justify-content-center">
        {options.map(opt => {
          const Icon = opt.icon;
          const isSelected = multi
            ? (selected || []).includes(opt.value)
            : selected === opt.value;
          return (
            <div key={opt.value} className={multi ? 'col-12 col-sm-6' : 'col-12 col-sm-10 col-md-8'}>
              <button
                onClick={() => onToggle(opt.value)}
                style={{
                  width: '100%',
                  background: isSelected ? `rgba(116,100,220,0.08)` : 'var(--bg-card)',
                  border: `2px solid ${isSelected ? 'var(--accent-green)' : 'var(--border-color)'}`,
                  borderRadius: 14,
                  padding: '20px 18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? 'var(--glow-green)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-bright)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${opt.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: opt.color, flexShrink: 0,
                }}>
                  <Icon size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  {opt.desc && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {opt.desc}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <CheckCircle size={20} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUser } = useApp();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    skillLevel: null,
    teamInterest: null,
    focusAreas: [],
    purpose: null,
    experienceType: null,
    userType: null,
  });

  const handleToggleMulti = (field, value) => {
    setData(prev => {
      const arr = prev[field] || [];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  };

  const handleToggleSingle = (field, value) => {
    setData(prev => ({ ...prev, [field]: prev[field] === value ? null : value }));
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return true;
      case 1: return !!data.skillLevel;
      case 2: return !!data.teamInterest;
      case 3: return data.focusAreas.length > 0;
      case 4: return !!data.purpose;
      case 5: return !!data.experienceType;
      default: return true;
    }
  };

  const finish = async () => {
    const userType = data.purpose === 'competitive' ? 'competitor' : 'student';
    const payload = { ...data, userType };
    const updated = await onboardingService.saveOnboarding(payload);
    updateUser({ onboardingCompleted: true, userType, onboarding: payload });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="auth-page" style={{ padding: '40px 16px' }}>
      <div className="auth-bg" />
      <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 32, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-green)' }}>
              {STEPS[step].title}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, background: 'var(--accent-green)',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Step content */}
        <div className="auth-card" style={{ padding: '32px 36px', width: '100%', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
          {step === 1 && (
            <SelectionStep
              title="What's your skill level?"
              subtitle="We'll recommend challenges based on your experience"
              options={SKILL_OPTIONS}
              selected={data.skillLevel}
              onToggle={(v) => handleToggleSingle('skillLevel', v)}
            />
          )}
          {step === 2 && (
            <SelectionStep
              title="Which team interests you?"
              subtitle="Choose your cybersecurity path"
              options={TEAM_OPTIONS}
              selected={data.teamInterest}
              onToggle={(v) => handleToggleSingle('teamInterest', v)}
            />
          )}
          {step === 3 && (
            <SelectionStep
              title="Pick your focus areas"
              subtitle="Select one or more areas you want to explore"
              options={FOCUS_OPTIONS}
              selected={data.focusAreas}
              onToggle={(v) => handleToggleMulti('focusAreas', v)}
              multi
            />
          )}
          {step === 4 && (
            <SelectionStep
              title="Why are you here?"
              subtitle="Tell us your primary goal"
              options={PURPOSE_OPTIONS}
              selected={data.purpose}
              onToggle={(v) => handleToggleSingle('purpose', v)}
            />
          )}
          {step === 5 && (
            <SelectionStep
              title="What's your background?"
              subtitle="Help us understand your experience"
              options={EXPERIENCE_OPTIONS}
              selected={data.experienceType}
              onToggle={(v) => handleToggleSingle('experienceType', v)}
            />
          )}

          {/* Navigation */}
          {step > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={() => setStep(s => s - 1)}
                style={{ padding: '10px 20px' }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canAdvance()}
                  style={{ padding: '10px 24px' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={finish}
                  disabled={!canAdvance()}
                  style={{ padding: '10px 24px' }}
                >
                  <CheckCircle size={16} /> Complete Setup
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
