import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flag, GraduationCap, Swords } from 'lucide-react';
import ChallengeCard from '../components/ui/ChallengeCard';
import ChallengeFilter from '../components/ui/ChallengeFilter';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { challengeService } from '../services/challengeService';
import { useApp } from '../context/AppContext';

export default function Challenges() {
  const { user, updateUser } = useApp();
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  const [allChallenges, setAllChallenges] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: urlCategory || 'All',
    difficulty: 'All',
    status: 'All',
    sort: 'default',
  });

  const userType = user?.userType;
  const focusAreas = user?.onboarding?.focusAreas || [];

  useEffect(() => {
    if (urlCategory) setFilters(f => ({ ...f, category: urlCategory }));
  }, [urlCategory]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await challengeService.getChallenges();
      setAllChallenges(list);
      setFiltered(list);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const list = await challengeService.getChallenges(filters);

      let final = list;
      if (userType === 'student' && !filters.search && filters.difficulty === 'All' && filters.category === 'All') {
        const interestMatches = focusAreas.length
          ? list.filter(c => focusAreas.includes(c.category) && !c.solved).concat(list.filter(c => !focusAreas.includes(c.category) && !c.solved))
          : list.filter(c => !c.solved);
        const diffOrder = { Easy: 0, Medium: 1, Hard: 2, Insane: 3 };
        final = interestMatches.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty] || b.points - a.points);
      }

      setFiltered(final);
    })();
  }, [filters, userType, focusAreas]);

  const diffOrder = { Easy: 0, Medium: 1, Hard: 2, Insane: 3 };
  const grouped = ['Easy', 'Medium', 'Hard', 'Insane'].reduce((acc, d) => {
    const g = filtered.filter(c => c.difficulty === d);
    if (g.length) acc[d] = g;
    return acc;
  }, {});
  const hasGroups = filters.sort === 'default' && !filters.search && Object.keys(grouped).length > 0;

  const switchMode = (mode) => {
    updateUser({ userType: mode });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div>
            <div className="section-title mb-2">Browse</div>
            <h1 style={{ margin: 0 }}>Challenges</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.9rem' }}>
              {userType === 'student'
                ? 'Curated learning path. Start with recommended challenges and grow your skills progressively.'
                : 'Find your next target. Earn points. Climb the ranks.'}
            </p>
          </div>
          <div style={{
            display: 'flex', gap: 20, fontFamily: 'var(--font-mono)',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '12px 20px',
          }}>
            <div className="text-center">
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>{allChallenges.length}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div className="text-center">
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--diff-easy)' }}>
                {allChallenges.filter(c => c.solved).length}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Solved</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div className="text-center">
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {allChallenges.filter(c => !c.solved).length}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Remaining</div>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'inline-flex', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 4, marginTop: 20 }}>
          <button
            onClick={() => switchMode('student')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 7,
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              background: userType === 'student' ? 'rgba(61,221,208,0.12)' : 'transparent',
              color: userType === 'student' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <GraduationCap size={15} /> Student Mode
          </button>
          <button
            onClick={() => switchMode('competitor')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 7,
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              background: userType === 'competitor' ? 'rgba(139,92,246,0.12)' : 'transparent',
              color: userType === 'competitor' ? 'var(--accent-purple)' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Swords size={15} /> Competitor Mode
          </button>
        </div>
      </div>

      {/* Filter */}
      <ChallengeFilter filters={filters} onChange={setFilters} total={filtered.length} />

      {/* Results */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading challenges..." />
      ) : filtered.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon"><Flag /></div>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>No challenges found</div>
          <div style={{ fontSize: '0.85rem' }}>Try adjusting your filters.</div>
        </div>
      ) : hasGroups ? (
        // Grouped by difficulty
        Object.entries(grouped).map(([diff, group]) => (
          <div key={diff} className="mb-5">
            <div className="d-flex align-items-center gap-3 mb-3">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: diff === 'Easy' ? 'var(--diff-easy)' : `var(--diff-${diff.toLowerCase()})` }}>
                {diff}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {group.length} challenge{group.length !== 1 ? 's' : ''}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>
            <div className="row g-3">
              {group.map((c, i) => (
                <div key={c.id} className="col-md-6 col-xl-4">
                  <ChallengeCard challenge={c} index={i} />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        // Flat grid
        <div className="row g-3">
          {filtered.map((c, i) => (
            <div key={c.id} className="col-md-6 col-xl-4">
              <ChallengeCard challenge={c} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
