import { useMemo, useState } from 'react';
import questions from './data/questions.json';
import scenarios from './data/scenarios.json';

const customerTypes = ['bakery', 'food manufacturer', '3PL', 'warehouse', 'e-commerce shipper', 'industrial manufacturer'];
const tabs = ['Learn', 'Drill', 'Conversation', 'Roleplay', 'Field', 'Manager'];

const getPurposePrompt = (q) => `${q.originalQuestion} → ${q.purpose}`;

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const parseJsonArray = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function App() {
  const [tab, setTab] = useState('Learn');
  const [learnIdx, setLearnIdx] = useState(0);
  const [drillScore, setDrillScore] = useState(() => safeNumber(readStorage('drillScore', '0'), 0));
  const [customerType, setCustomerType] = useState(customerTypes[0]);
  const [mgrScores, setMgrScores] = useState(() => parseJsonArray(readStorage('mgrScores', '[]')));
  const [storageWarning, setStorageWarning] = useState('');
  const [roleplayIdx, setRoleplayIdx] = useState(0);
  const [roleplayRevealed, setRoleplayRevealed] = useState(false);

  const progress = Math.round(((tabs.indexOf(tab) + 1) / tabs.length) * 100);
  const current = questions[learnIdx] || questions[0];
  const random = useMemo(() => questions[Math.floor(Math.random() * questions.length)] || questions[0], [drillScore, tab]);
  const scenario = scenarios[roleplayIdx] || scenarios[0];

  const addDrill = (delta) => {
    const next = drillScore + delta;
    setDrillScore(next);
    if (!writeStorage('drillScore', String(next))) {
      setStorageWarning('Storage is unavailable on this device/browser. Scores will reset when you refresh.');
    }
  };

  const saveManagerScore = (formData) => {
    const record = Object.fromEntries(formData.entries());
    record.date = new Date().toISOString();
    const next = [...mgrScores, record];
    setMgrScores(next);
    if (!writeStorage('mgrScores', JSON.stringify(next))) {
      setStorageWarning('Storage is unavailable on this device/browser. Manager scorecards will not persist.');
    }
  };

  const exportCsv = () => {
    if (!mgrScores.length) return;
    const keys = Object.keys(mgrScores[0]);
    const rows = [keys.join(','), ...mgrScores.map((r) => keys.map((k) => r[k]).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'vision-10q-manager-scorecard.csv';
    a.click();
  };

  const goRoleplay = (idx) => {
    setRoleplayIdx(idx);
    setRoleplayRevealed(false);
  };

  return (
    <main className="app">
      <header>
        <h1>Vision 10Q Trainer</h1>
        <p>Train reps to ask discovery questions naturally.</p>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      </header>
      {!!storageWarning && <p className="warning">{storageWarning}</p>}
      <nav className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>

      {tab === 'Learn' && <section className="card">
        <h2>Learn Mode</h2>
        <h3>Q{current.id}: {current.originalQuestion}</h3>
        <p><strong>Purpose:</strong> {current.purpose}</p>
        <p><strong>Casual version:</strong> {current.casualVersion}</p>
        <ul>{current.followUps.map((f) => <li key={f}>{f}</li>)}</ul>
        <p><strong>Common mistake:</strong> {current.commonMistake}</p>
        <p><strong>Coaching:</strong> {current.managerCoachingNote}</p>
        <div className="row"><button onClick={() => setLearnIdx((learnIdx + questions.length - 1) % questions.length)}>Prev</button><button onClick={() => setLearnIdx((learnIdx + 1) % questions.length)}>Next</button></div>
      </section>}

      {tab === 'Drill' && <section className="card"><h2>Drill Mode</h2><p><strong>Score:</strong> {drillScore}</p>
      <p>Timed recall (self-run 30s): Say all 10 questions out loud, then self-score.</p><div className="row"><button onClick={() => addDrill(2)}>Completed clean (+2)</button><button onClick={() => addDrill(1)}>Completed with prompts (+1)</button></div>
      <h3>Random Question Quiz</h3><p>{random.originalQuestion}</p><button onClick={() => addDrill(1)}>I explained purpose correctly</button>
      <h3>Match to Purpose</h3><p>{getPurposePrompt(random)}</p><button onClick={() => addDrill(1)}>Matched correctly</button></section>}

      {tab === 'Conversation' && <section className="card"><h2>Conversation Mode</h2>
      <label>Customer type<select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>{customerTypes.map((c) => <option key={c}>{c}</option>)}</select></label>
      <ol>{questions.map((q) => <li key={q.id}><strong>{q.conversationVersions?.[customerType] ?? q.casualVersion}</strong></li>)}</ol></section>}

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

      {tab === 'Field' && <section className="card"><h2>Field Mode</h2>
      <p><strong>Opening line:</strong> "I work with teams like yours to tighten packaging cost and performance. Mind if I ask a few quick questions?"</p>
      <ol>{questions.map((q) => <li key={q.id}>{q.casualVersion}</li>)}</ol>
      <p><strong>Closing question:</strong> "Would it make sense to review options before your next order window?"</p>
      <textarea readOnly value={'Salesforce Note Template\nAccount:\nContact:\nWhat they do:\nCurrent items:\nOrder cadence:\nPricing baseline:\nShipping method:\nVolume:\nCurrent suppliers:\nNext order date:\nReferral targets:\nNext step:'} />
      </section>}

      {tab === 'Manager' && <section className="card"><h2>Manager Scorecard</h2>
      <form onSubmit={(e) => { e.preventDefault(); saveManagerScore(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
      {['rep', 'memory', 'meaning', 'conversation', 'followup', 'salesuse'].map((k) => <label key={k}>{k}<input name={k} required /></label>)}
      <button type="submit">Save score</button></form>
      <button onClick={exportCsv}>Export CSV</button>
      <p>Saved records: {mgrScores.length}</p>
      </section>}
    </main>
  );
}
