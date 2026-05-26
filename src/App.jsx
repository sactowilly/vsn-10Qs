import { useMemo, useState } from 'react';
import questions from './data/questions.json';
import scenarios from './data/scenarios.json';
import recallBank from './data/recallBank.json';
import flashcardData from './data/flashcards.json';

const customerTypes = ['bakery', 'food manufacturer', '3PL', 'warehouse', 'e-commerce shipper', 'industrial manufacturer'];
const tabs = ['Learn', 'Drill', 'Field', 'Roleplay', 'Flashcards'];

const openingLines = {
  'bakery': 'I work with bakeries and food producers on packaging cost and availability. Mind if I ask a few quick questions?',
  'food manufacturer': 'I work with food manufacturers to tighten packaging cost and reliability. Mind if I ask a few quick questions?',
  '3PL': 'I work with 3PLs and fulfillment operations on packaging supply and cost. Mind if I ask a few quick questions?',
  'warehouse': 'I work with warehouse and distribution operations to cut packaging cost. Mind if I ask a few quick questions?',
  'e-commerce shipper': 'I work with e-commerce businesses to lower per-shipment packaging cost. Mind if I ask a few quick questions?',
  'industrial manufacturer': 'I work with manufacturers to tighten packaging cost and performance. Mind if I ask a few quick questions?',
};

const getPurposePrompt = (q) => `${q.originalQuestion} → ${q.purpose}`;

const readStorage = (key, fallback) => {
  try { const r = window.localStorage.getItem(key); return r == null ? fallback : r; } catch { return fallback; }
};
const writeStorage = (key, value) => {
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
};
const parseJsonArray = (raw) => {
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
};

const generateRound = () => {
  const items = [];
  for (let qId = 1; qId <= 10; qId++) {
    const pool = recallBank.rewordings.filter(r => r.qId === qId);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    items.push({ id: `real-${qId}`, text: picked.text, isReal: true, qId });
  }
  const shuffledFakes = [...recallBank.fakes].sort(() => Math.random() - 0.5).slice(0, 5);
  shuffledFakes.forEach((text, i) => items.push({ id: `fake-${i}`, text, isReal: false, qId: null }));
  return items.sort(() => Math.random() - 0.5);
};

export default function App() {
  const [tab, setTab] = useState('Learn');

  // Learn
  const [learnIdx, setLearnIdx] = useState(0);

  // Drill / Recall
  const [recallItems, setRecallItems] = useState(() => generateRound());
  const [recallChecked, setRecallChecked] = useState(() => new Set());
  const [recallSubmitted, setRecallSubmitted] = useState(false);

  // Field
  const [customerType, setCustomerType] = useState(customerTypes[0]);

  // Roleplay
  const [roleplayIdx, setRoleplayIdx] = useState(0);
  const [roleplayRevealed, setRoleplayRevealed] = useState(false);

  // Flashcards
  const [flashType, setFlashType] = useState('question');
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  const [storageWarning, setStorageWarning] = useState('');

  const progress = Math.round(((tabs.indexOf(tab) + 1) / tabs.length) * 100);
  const current = questions[learnIdx] || questions[0];
  const random = useMemo(() => questions[Math.floor(Math.random() * questions.length)], [tab]);
  const scenario = scenarios[roleplayIdx] || scenarios[0];

  const flashDeck = flashType === 'question' ? questions : flashcardData.responseCards;
  const flashCard = flashDeck[flashIdx] || flashDeck[0];

  // Recall helpers
  const toggleCheck = (id) => {
    if (recallSubmitted) return;
    setRecallChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const submitRecall = () => setRecallSubmitted(true);
  const newRound = () => {
    setRecallItems(generateRound());
    setRecallChecked(new Set());
    setRecallSubmitted(false);
  };
  const correctCount = recallItems.filter(i => i.isReal && recallChecked.has(i.id)).length;
  const falsePositives = recallItems.filter(i => !i.isReal && recallChecked.has(i.id)).length;

  // Roleplay helpers
  const goRoleplay = (idx) => { setRoleplayIdx(idx); setRoleplayRevealed(false); };

  // Flashcard helpers
  const goFlash = (idx) => { setFlashIdx(idx); setFlashFlipped(false); };
  const setFlashTypeAndReset = (type) => { setFlashType(type); setFlashIdx(0); setFlashFlipped(false); };

  return (
    <main className="app">
      <header>
        <h1>Vision 10Q Trainer</h1>
        <p>Train reps to ask discovery questions naturally.</p>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      </header>
      {!!storageWarning && <p className="warning">{storageWarning}</p>}
      <nav className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>

      {/* ── LEARN ── */}
      {tab === 'Learn' && <section className="card">
        <h2>Learn Mode</h2>
        <h3>Q{current.id}: {current.originalQuestion}</h3>
        <p><strong>Purpose:</strong> {current.purpose}</p>
        <p><strong>Casual version:</strong> {current.casualVersion}</p>
        <ul>{current.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
        <p><strong>Common mistake:</strong> {current.commonMistake}</p>
        <p><strong>Coaching:</strong> {current.managerCoachingNote}</p>
        <div className="row">
          <button onClick={() => setLearnIdx((learnIdx + questions.length - 1) % questions.length)}>Prev</button>
          <button onClick={() => setLearnIdx((learnIdx + 1) % questions.length)}>Next</button>
        </div>
      </section>}

      {/* ── DRILL / RECALL ── */}
      {tab === 'Drill' && <section className="card">
        <h2>Recall</h2>
        <p className="drill-instructions">Check the <strong>10</strong> questions that are part of the Vision discovery framework. Watch out — 5 are decoys.</p>
        <ul className="recall-list">
          {recallItems.map((item) => {
            const checked = recallChecked.has(item.id);
            let statusClass = '';
            if (recallSubmitted) {
              if (item.isReal && checked) statusClass = 'correct';
              else if (item.isReal && !checked) statusClass = 'missed';
              else if (!item.isReal && checked) statusClass = 'trap';
            }
            return (
              <li key={item.id} className={`recall-item ${statusClass}`}>
                <label>
                  <input type="checkbox" checked={checked} onChange={() => toggleCheck(item.id)} disabled={recallSubmitted} />
                  <span>{item.text}</span>
                </label>
                {recallSubmitted && statusClass === 'correct' && <span className="recall-badge">✓</span>}
                {recallSubmitted && statusClass === 'missed' && <span className="recall-badge">missed</span>}
                {recallSubmitted && statusClass === 'trap' && <span className="recall-badge">decoy</span>}
              </li>
            );
          })}
        </ul>
        {!recallSubmitted ? (
          <button onClick={submitRecall} disabled={recallChecked.size === 0}>Submit ({recallChecked.size} selected)</button>
        ) : (
          <div className="recall-score">
            <p className="score-headline">
              {correctCount === 10 ? '🎯 Perfect — 10 / 10' : `${correctCount} / 10 correct${falsePositives > 0 ? ` · ${falsePositives} decoy${falsePositives > 1 ? 's' : ''} flagged` : ''}`}
            </p>
            {correctCount < 10 && <p className="score-sub">Review the missed ones in Learn mode, then try a new round.</p>}
            <button onClick={newRound}>New Round</button>
          </div>
        )}
      </section>}

      {/* ── FIELD (merged Conversation + Field) ── */}
      {tab === 'Field' && <section className="card">
        <h2>Field Guide</h2>
        <label>Customer type
          <select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
            {customerTypes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="field-block">
          <span className="field-label">Opening</span>
          <p>{openingLines[customerType]}</p>
        </div>
        <ol className="field-questions">
          {questions.map((q) => (
            <li key={q.id}>{q.conversationVersions?.[customerType] ?? q.casualVersion}</li>
          ))}
        </ol>
        <div className="field-block">
          <span className="field-label">Close</span>
          <p>Would it make sense to get you a quote before your next order window?</p>
        </div>
        <textarea readOnly value={
          'Salesforce Note\n' +
          'Account:\nContact:\nWhat they do:\nCurrent items:\n' +
          'Order cadence:\nPricing baseline:\nShip method:\nVolume:\n' +
          'Current suppliers:\nNext order date:\nReferral targets:\nNext step:'
        } />
      </section>}

      {/* ── ROLEPLAY ── */}
      {tab === 'Roleplay' && <section className="card">
        <h2>Roleplay Mode</h2>
        <p className="roleplay-counter">{roleplayIdx + 1} of {scenarios.length}</p>
        <p className="roleplay-setting">{scenario.setting}</p>
        <div className="roleplay-customer">
          <span className="roleplay-label">Customer</span>
          <p>"{scenario.customerLine}"</p>
        </div>
        <p className="roleplay-prompt">What do you say?</p>
        {!roleplayRevealed && (
          <button className="reveal-btn" onClick={() => setRoleplayRevealed(true)}>Reveal best response</button>
        )}
        {roleplayRevealed && (
          <div className="roleplay-revealed">
            <div className="roleplay-response">
              <span className="roleplay-label">Best response</span>
              <p>"{scenario.bestResponse}"</p>
            </div>
            <div className="roleplay-coaching">
              <span className="roleplay-label">Why it works</span>
              <p>{scenario.coaching}</p>
            </div>
            <div className="roleplay-trap">
              <span className="roleplay-label">Common trap</span>
              <p>{scenario.trap}</p>
            </div>
          </div>
        )}
        <div className="row three">
          <button onClick={() => goRoleplay((roleplayIdx + scenarios.length - 1) % scenarios.length)}>Prev</button>
          <button onClick={() => goRoleplay(Math.floor(Math.random() * scenarios.length))}>Random</button>
          <button onClick={() => goRoleplay((roleplayIdx + 1) % scenarios.length)}>Next</button>
        </div>
      </section>}

      {/* ── FLASHCARDS ── */}
      {tab === 'Flashcards' && <section className="card">
        <h2>Flashcards</h2>
        <div className="row flash-toggle">
          <button className={flashType === 'question' ? 'active' : ''} onClick={() => setFlashTypeAndReset('question')}>10Q Cards</button>
          <button className={flashType === 'response' ? 'active' : ''} onClick={() => setFlashTypeAndReset('response')}>Response Cards</button>
        </div>
        <p className="roleplay-counter">{flashIdx + 1} of {flashDeck.length}</p>
        <div className={`flashcard ${flashType}`} onClick={() => setFlashFlipped(f => !f)}>
          {!flashFlipped ? (
            <div className="flash-front">
              <span className="flash-tag">{flashType === 'question' ? 'Q' : 'A'}</span>
              <p>{flashType === 'question' ? flashCard.originalQuestion : flashCard.customerSays}</p>
              <span className="flip-hint">tap to reveal →</span>
            </div>
          ) : (
            <div className="flash-back">
              {flashType === 'question' ? (
                <p>{flashCard.purpose}</p>
              ) : (
                <>
                  <strong>Q{flashCard.questionId}: {flashCard.questionLabel}</strong>
                  <p>{flashCard.coaching}</p>
                </>
              )}
              <span className="flip-hint">tap to flip back</span>
            </div>
          )}
        </div>
        <div className="row">
          <button onClick={() => goFlash((flashIdx + flashDeck.length - 1) % flashDeck.length)}>Prev</button>
          <button onClick={() => goFlash((flashIdx + 1) % flashDeck.length)}>Next</button>
        </div>
      </section>}
    </main>
  );
}
