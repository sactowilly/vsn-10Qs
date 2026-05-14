import { useMemo, useState } from 'react';
import questions from './data/questions.json';

const customerTypes = ['bakery', 'food manufacturer', '3PL', 'warehouse', 'e-commerce shipper', 'industrial manufacturer'];
const tabs = ['Learn', 'Drill', 'Conversation', 'Roleplay', 'Field', 'Manager'];

const getPurposePrompt = (q) => `${q.originalQuestion} → ${q.purpose}`;

export default function App() {
  const [tab, setTab] = useState('Learn');
  const [learnIdx, setLearnIdx] = useState(0);
  const [drillScore, setDrillScore] = useState(Number(localStorage.getItem('drillScore') || 0));
  const [customerType, setCustomerType] = useState(customerTypes[0]);
  const [mgrScores, setMgrScores] = useState(JSON.parse(localStorage.getItem('mgrScores') || '[]'));

  const progress = Math.round(((tabs.indexOf(tab) + 1) / tabs.length) * 100);
  const current = questions[learnIdx];
  const random = useMemo(() => questions[Math.floor(Math.random() * questions.length)], [drillScore, tab]);

  const addDrill = (delta) => {
    const next = drillScore + delta;
    setDrillScore(next);
    localStorage.setItem('drillScore', String(next));
  };

  const saveManagerScore = (formData) => {
    const record = Object.fromEntries(formData.entries());
    record.date = new Date().toISOString();
    const next = [...mgrScores, record];
    setMgrScores(next);
    localStorage.setItem('mgrScores', JSON.stringify(next));
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

  return (
    <main className="app">
      <header>
        <h1>Vision 10Q Trainer</h1>
        <p>Train reps to ask discovery questions naturally.</p>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      </header>
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
      <ol>{questions.map((q) => <li key={q.id}><strong>{q.casualVersion}</strong> <em>(for {customerType})</em></li>)}</ol></section>}

      {tab === 'Roleplay' && <section className="card"><h2>Roleplay Mode</h2>
      <p><strong>Customer:</strong> "We already have a supplier and pricing is fine."</p>
      <p><strong>Best next question:</strong> "If something improved performance or reduced freight, what would you want to see first?"</p>
      <p><strong>Coaching feedback:</strong> Acknowledge current supplier, then qualify openness to change with a value-based question.</p>
      </section>}

      {tab === 'Field' && <section className="card"><h2>Field Mode</h2>
      <p><strong>Opening line:</strong> "I work with teams like yours to tighten packaging cost and performance. Mind if I ask a few quick questions?"</p>
      <ol>{questions.map((q) => <li key={q.id}>{q.casualVersion}</li>)}</ol>
      <p><strong>Closing question:</strong> "Would it make sense to review options before your next order window?"</p>
      <textarea readOnly value={'Salesforce Note Template\nAccount:\nContact:\nWhat they do:\nCurrent items:\nOrder cadence:\nPricing baseline:\nShipping method:\nVolume:\nCurrent suppliers:\nNext order date:\nReferral targets:\nNext step:'} />
      </section>}

      {tab === 'Manager' && <section className="card"><h2>Manager Scorecard</h2>
      <form onSubmit={(e) => {e.preventDefault(); saveManagerScore(new FormData(e.currentTarget)); e.currentTarget.reset();}}>
      {['rep', 'memory', 'meaning', 'conversation', 'followup', 'salesuse'].map((k) => <label key={k}>{k}<input name={k} required /></label>)}
      <button type="submit">Save score</button></form>
      <button onClick={exportCsv}>Export CSV</button>
      <p>Saved records: {mgrScores.length}</p>
      </section>}
    </main>
  );
}
