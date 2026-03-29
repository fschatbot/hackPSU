import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAI } from '../../contexts/AIContext';

const STORAGE_KEY = 'codelens_tutorial_done';

const DIFFICULTY_PRESETS = [
  { label: 'Complete Beginner', value: 0,   desc: 'Explain everything from scratch' },
  { label: 'Student',           value: 25,  desc: 'Learning programming basics' },
  { label: 'Intermediate',      value: 50,  desc: 'Comfortable with code' },
  { label: 'Advanced',          value: 75,  desc: 'Experienced developer' },
  { label: 'Expert',            value: 100, desc: 'Talk to me like a senior engineer' },
];

const STEPS = [
  // Step 0 is the difficulty modal — no spotlight
  {
    id: 'difficulty',
    spotlight: null,
  },
  {
    id: 'file-explorer',
    spotlight: '[data-tutorial="file-explorer"]',
    title: 'File Explorer',
    body: 'Browse your project files here. Right-click any file to rename or delete it. Use the + buttons to create new files and folders, or drag & drop to upload.',
    arrowSide: 'left',
  },
  {
    id: 'code-editor',
    spotlight: '[data-tutorial="code-editor"]',
    title: 'Code Editor',
    body: 'Your code lives here. Select any snippet — a line, a function, or the whole file — and the AI will instantly analyze it in the panel on the right.',
    arrowSide: 'left',
  },
  {
    id: 'ai-chat',
    spotlight: '[data-tutorial="ai-chat"]',
    title: 'AI Assistant',
    body: 'AI responses stream in here. You can also type questions manually. Each file and mode keeps its own separate chat history.',
    arrowSide: 'right',
  },
  {
    id: 'modes',
    spotlight: '[data-tutorial="mode-buttons"]',
    title: 'Analysis Modes',
    body: (
      <>
        Switch between four lenses:&nbsp;
        <b style={{ color: '#a5b4fc' }}>Explain</b> what code does,&nbsp;
        <b style={{ color: '#b89af5' }}>Teach</b> the CS concepts behind it,&nbsp;
        <b style={{ color: '#fb923c' }}>Review</b> for bugs and issues, or&nbsp;
        <b style={{ color: '#5eead4' }}>Quiz</b> yourself to lock in understanding.
      </>
    ),
    arrowSide: 'top',
  },
];

// ── Measure a DOM element relative to viewport ──────────────────────────────
function measureEl(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// ── Tooltip positioning ──────────────────────────────────────────────────────
function tooltipStyle(rect, arrowSide) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };

  const GAP = 16;
  const TW = 300; // tooltip width (must match CSS)

  switch (arrowSide) {
    case 'left':   // tooltip to the right of spotlight
      return {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + GAP,
        transform: 'translateY(-50%)',
      };
    case 'right':  // tooltip to the left of spotlight
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - TW - GAP,
        transform: 'translateY(-50%)',
      };
    case 'top':    // tooltip below spotlight (centered)
      return {
        top: rect.top + rect.height + GAP,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'bottom': // tooltip above spotlight
      return {
        top: rect.top - GAP,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      };
    default:
      return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }
}

// ── Main Tutorial component ──────────────────────────────────────────────────
export function Tutorial({ onDone }) {
  const { setExperienceLevel } = useAI();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(50);
  const [spotRect, setSpotRect] = useState(null);
  const [flash, setFlash] = useState(false);     // red flash on wrong click
  const flashTimeout = useRef(null);
  const tooltipRef = useRef(null);

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Measure spotlight target whenever step changes
  useEffect(() => {
    if (!currentStep.spotlight) { setSpotRect(null); return; }
    // slight delay to let layout settle
    const id = setTimeout(() => setSpotRect(measureEl(currentStep.spotlight)), 60);
    return () => clearTimeout(id);
  }, [step, currentStep.spotlight]);

  // Re-measure on resize
  useEffect(() => {
    if (!currentStep.spotlight) return;
    const handler = () => setSpotRect(measureEl(currentStep.spotlight));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [currentStep.spotlight]);

  const advance = useCallback(() => {
    if (isLast) {
      setExperienceLevel(level);
      localStorage.setItem(STORAGE_KEY, '1');
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, level, setExperienceLevel, onDone]);

  // Click anywhere outside tooltip → flash red, don't advance
  const handleOverlayClick = useCallback((e) => {
    if (tooltipRef.current && tooltipRef.current.contains(e.target)) return;
    // Flash
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    setFlash(true);
    flashTimeout.current = setTimeout(() => setFlash(false), 600);
  }, []);

  useEffect(() => () => flashTimeout.current && clearTimeout(flashTimeout.current), []);

  // ── Difficulty step ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={handleOverlayClick}
      >
        <div
          ref={tooltipRef}
          style={{
            background: '#1a1a2e',
            border: `2px solid ${flash ? '#f87171' : 'rgba(139,92,246,0.6)'}`,
            borderRadius: 16,
            padding: '32px 36px',
            width: 460,
            maxWidth: '90vw',
            boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
            transition: 'border-color 0.15s',
            animation: 'tutorialFadeIn 0.3s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Logo/title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'rgba(139,92,246,0.8)',
              fontFamily: "'Geist Mono', monospace", marginBottom: 10,
            }}>
              Welcome to CodeLens
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: '#e2e8f0',
              fontFamily: "'Inter', sans-serif", lineHeight: 1.3,
            }}>
              What's your experience level?
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              This tunes how the AI explains code to you. You can change it anytime.
            </div>
          </div>

          {/* Preset pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {DIFFICULTY_PRESETS.map((p) => {
              const active = level === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setLevel(p.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: active ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: active ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                    fontFamily: "'Geist Mono', monospace", flexShrink: 0,
                  }}>
                    {p.value}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#e2e8f0' : 'rgba(255,255,255,0.6)' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                      {p.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fine-tune slider */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Geist Mono', monospace" }}>
                Beginner
              </span>
              <span style={{ fontSize: 11, color: 'rgba(139,92,246,0.8)', fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>
                {level}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Geist Mono', monospace" }}>
                Expert
              </span>
            </div>
            <input
              type="range"
              min={0} max={100} value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
          </div>

          {/* CTA */}
          <button
            onClick={advance}
            style={{
              width: '100%', padding: '12px 0',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Let's go →
          </button>
        </div>

        <style>{`
          @keyframes tutorialFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes tutorialSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── Spotlight steps ────────────────────────────────────────────────────────
  const PAD = 8;
  const spot = spotRect
    ? {
        top:    spotRect.top    - PAD,
        left:   spotRect.left   - PAD,
        width:  spotRect.width  + PAD * 2,
        height: spotRect.height + PAD * 2,
      }
    : null;

  const tipStyle = tooltipStyle(spot, currentStep.arrowSide);
  const stepNum = step; // 1-based display: step / (STEPS.length-1)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'auto' }}
      onClick={handleOverlayClick}
    >
      {/* Dark overlay — 4 rects around the spotlight hole */}
      {spot ? (
        <>
          {/* top */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: spot.top, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }} />
          {/* bottom */}
          <div style={{ position: 'fixed', top: spot.top + spot.height, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }} />
          {/* left */}
          <div style={{ position: 'fixed', top: spot.top, left: 0, width: spot.left, height: spot.height, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }} />
          {/* right */}
          <div style={{ position: 'fixed', top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }} />
          {/* spotlight border ring */}
          <div style={{
            position: 'fixed',
            top: spot.top, left: spot.left,
            width: spot.width, height: spot.height,
            border: '2px solid rgba(139,92,246,0.7)',
            borderRadius: 8,
            boxShadow: '0 0 0 4px rgba(139,92,246,0.12), inset 0 0 0 1px rgba(139,92,246,0.2)',
            pointerEvents: 'none',
          }} />
        </>
      ) : (
        // No spotlight measured yet — full dim
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }} />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          ...tipStyle,
          width: 300,
          background: '#1a1a2e',
          border: `2px solid ${flash ? '#f87171' : 'rgba(139,92,246,0.55)'}`,
          borderRadius: 12,
          padding: '18px 20px 16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          transition: 'border-color 0.15s',
          animation: 'tutorialSlideIn 0.25s ease',
          zIndex: 9001,
        }}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
          {STEPS.slice(1).map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i < stepNum ? '#7c3aed' : i === stepNum - 1 ? '#a78bfa' : 'rgba(255,255,255,0.12)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{
          fontSize: 14, fontWeight: 700, color: '#e2e8f0',
          marginBottom: 8, fontFamily: "'Inter', sans-serif",
        }}>
          {currentStep.title}
        </div>
        <div style={{
          fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
          fontFamily: "'Inter', sans-serif", marginBottom: 16,
        }}>
          {currentStep.body}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Geist Mono', monospace" }}>
            {stepNum} / {STEPS.length - 1}
          </span>
          <button
            onClick={advance}
            style={{
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isLast ? 'Done ✓' : 'Next →'}
          </button>
        </div>

        {flash && (
          <div style={{
            position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
            fontSize: 11, color: '#f87171', fontFamily: "'Inter', sans-serif",
            whiteSpace: 'nowrap', animation: 'tutorialFadeIn 0.15s ease',
          }}>
            Click "Next" to continue the tour
          </div>
        )}
      </div>
    </div>
  );
}

// Export the storage key so App can check it
export { STORAGE_KEY };
