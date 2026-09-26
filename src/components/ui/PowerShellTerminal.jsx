import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize, Minimize } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { challenges } from '../../data/challenges';

const BANNER = [
  'Windows PowerShell for CyberForge CTF',
  'Copyright (C) CyberForge. All rights reserved.',
  '',
  'Type "help" to see available commands.',
];

export default function PowerShellTerminal({ onClose }) {
  const { user } = useApp();
  const [lines, setLines] = useState([{ kind: 'out', text: BANNER[0] }, { kind: 'out', text: BANNER[1] }, { kind: 'out', text: '' }]);
  const [input, setInput] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const userLine = () => `PS C:\\Users\\${user?.username || 'operator'}>`;

  const runCommand = (raw) => {
    const cmd = raw.trim();
    const push = (kind, text) => setLines(prev => [...prev, { kind, text }]);

    if (!cmd) return;

    const [base, ...args] = cmd.split(/\s+/);
    const command = base.toLowerCase();

    push('cmd', `${userLine()} ${cmd}`);
    switch (command) {
      case 'help':
        push('out', '');
        push('info', 'Available commands:');
        push('out', '  help        Show this help message');
        push('out', '  whoami      Display current operator');
        push('out', '  points      Show your total points');
        push('out', '  rank        Show your global rank');
        push('out', '  streak      Show your current streak');
        push('out', '  challenges  List captured challenges');
        push('out', '  status      Platform & session status');
        push('out', '  ls          List available resources');
        push('out', '  clear       Clear the console');
        push('out', '  exit        Close the console');
        push('out', '');
        break;

      case 'whoami':
        push('info', user?.username || 'guest');
        push('out', `${user?.email || ''} · role: ${user?.role || 'user'} · mode: ${user?.userType || '—'}`);
        break;

      case 'points':
      case 'score':
        push('info', `${(user?.points || 0).toLocaleString()} pts`);
        push('out', `Target: 10,000 pts to reach Elite status.`);
        break;

      case 'rank':
        push('info', `#${user?.rank || '—'}`);
        push('out', `Global rank across all competitors.`);
        break;

      case 'streak':
        push('info', `${user?.streak || 0} day${(user?.streak || 0) === 1 ? '' : 's'}`);
        push('out', `Keep submitting flags to extend your streak.`);
        break;

      case 'challenges':
      case 'ls':
        if (command === 'ls') {
          push('out', 'Directory: C:\\Users\\' + (user?.username || 'operator'));
          push('out', '  Mode  Size  Name');
          push('out', '  ----  ----  ----');
          push('out', '  d----  -     Desktop');
          push('out', '  d----  -     Documents');
          push('out', '  d----  -     Downloads');
          push('out', '  -a---  ...   flags.db');
          push('out', '  -a---  ...   score.txt');
          break;
        }
        {
          const solved = challenges.filter(c => user?.solvedChallenges?.includes(c.id));
          push('out', `${solved.length}/${challenges.length} challenges captured:`);
          push('out', '');
          solved.forEach(c => {
            push('out', `  [CAPTURED]  ${c.title} (${c.category}) — ${c.points} pts`);
          });
          const remaining = challenges.length - solved.length;
          push('out', '');
          push('info', `${remaining} challenge${remaining === 1 ? '' : 's'} remaining.`);
        }
        break;

      case 'status':
        push('out', 'Platform: ONLINE');
        push('out', `Operator: ${user?.username || 'guest'}`);
        push('out', `Session: Active`);
        push('out', `Joined: ${user?.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}`);
        push('info', 'Keep hacking, operator.');
        break;

      case 'clear':
      case 'cls':
        setLines([{ kind: 'out', text: BANNER[0] }, { kind: 'out', text: BANNER[1] }, { kind: 'out', text: '' }]);
        break;

      case 'exit':
      case 'quit':
        onClose();
        break;

      default:
        push('err', `The term '${base}' is not recognized as the name of a cmdlet, function, script file, or operable program.`);
        push('out', 'Type "help" to see available commands.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') {
      if (e.target.value) runCommand(e.target.value);
      setInput('');
    }
  };

  return (
    <>
      <div className="ps-backdrop" onClick={onClose} />
      <div className={`ps-drawer ${fullscreen ? 'fullscreen' : ''}`}>
        <div className="ps-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="ps-title">Windows PowerShell</span>
          <div className="d-flex align-items-center gap-1 ms-auto">
            <button className="ps-btn" onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Restore panel' : 'Full screen'}>
              {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
            <button className="ps-btn" onClick={onClose} title="Close">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="ps-body" ref={bodyRef}>
          {lines.map((l, i) => (
            <span key={i} className={`ps-line ps-${l.kind}`} style={{ display: 'block' }}>
              {l.text || '\u00A0'}
            </span>
          ))}
          <div className="d-flex align-items-center" style={{ gap: 6 }}>
            <span className="ps-prompt">{userLine()}</span>
            <input
              ref={inputRef}
              className="ps-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              aria-label="PowerShell input"
            />
          </div>
        </div>
      </div>
    </>
  );
}