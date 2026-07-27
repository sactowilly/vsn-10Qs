import { useMemo, useState } from 'react';
import questions from './data/questions.json';
import scenarios from './data/scenarios.json';
import recallBank from './data/recallBank.json';
import flashcardData from './data/flashcards.json';
import { generateRound, pickDifferentIndex, scoreRound } from './lib/quiz.js';
import Icon from './components/Icon.jsx';

const customerTypes = ['bakery', 'food manufacturer', '3PL', 'warehouse', 'e-commerce shipper', 'industrial manufacturer'];
const requiredQuestionIds = questions.map(question => question.id);
const tabs = [
  { id: 'Learn', label: 'Learn', icon: 'book' },
  { id: 'Drill', label: 'Drill', icon: 'target' },
  { id: 'Field', label: 'Field', icon: 'clipboard' },
  { id: 'Roleplay', label: 'Roleplay', mobileLabel: 'Play', icon: 'messages' },
  { id: 'Flashcards', label: 'Cards', icon: 'cards' },
];

const openingLines = {
  bakery: 'I work with bakeries and food producers on packaging cost and availability. Mind if I ask a few quick questions?',
  'food manufacturer': 'I work with food manufacturers to tighten packaging cost and reliability. Mind if I ask a few quick questions?',
  '3PL': 'I work with 3PLs and fulfillment operations on packaging supply and cost. Mind if I ask a few quick questions?',
  warehouse: 'I work with warehouse and distribution operations to cut packaging cost. Mind if I ask a few quick questions?',
  'e-commerce shipper': 'I work with e-commerce businesses to lower per-shipment packaging cost. Mind if I ask a few quick questions?',
  'industrial manufacturer': 'I work with manufacturers to tighten packaging cost and performance. Mind if I ask a few quick questions?',
};

const salesforceTemplate =
  'Salesforce Note\n' +
  'Account:\nContact:\nWhat they do:\nCurrent items:\n' +
  'Order cadence:\nPricing baseline:\nShip method:\nVolume:\n' +
  'Current suppliers:\nNext order date:\nReferral targets:\nNext step:';

function PageIntro({ eyebrow, id, title, description }) {
  return (
    <div className="page-intro">
      <p className="page-eyebrow">{eyebrow}</p>
      <h2 className="page-title" id={id}>{title}</h2>
      <p className="page-description">{description}</p>
    </div>
  );
}

function ActionLabel({ icon, children }) {
  return (
    <span className="button-content">
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState('Learn');
  const [learnIdx, setLearnIdx] = useState(0);
  const [recallItems, setRecallItems] = useState(() => generateRound(recallBank, requiredQuestionIds));
  const [recallChecked, setRecallChecked] = useState(() => new Set());
  const [recallSubmitted, setRecallSubmitted] = useState(false);
  const [customerType, setCustomerType] = useState(customerTypes[0]);
  const [copyStatus, setCopyStatus] = useState('');
  const [roleplayIdx, setRoleplayIdx] = useState(0);
  const [roleplayRevealed, setRoleplayRevealed] = useState(false);
  const [flashType, setFlashType] = useState('question');
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  const current = questions[learnIdx] || questions[0];
  const scenario = scenarios[roleplayIdx] || scenarios[0];
  const flashDeck = flashType === 'question' ? questions : flashcardData.responseCards;
  const flashCard = flashDeck[flashIdx] || flashDeck[0];
  const recallResult = useMemo(
    () => scoreRound(recallItems, recallChecked),
    [recallItems, recallChecked],
  );
  const selectionComplete = recallChecked.size === requiredQuestionIds.length;

  const toggleCheck = id => {
    if (recallSubmitted) return;
    setRecallChecked(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else if (next.size < requiredQuestionIds.length) next.add(id);
      return next;
    });
  };

  const newRound = () => {
    setRecallItems(generateRound(recallBank, requiredQuestionIds));
    setRecallChecked(new Set());
    setRecallSubmitted(false);
  };

  const goRoleplay = idx => {
    setRoleplayIdx(idx);
    setRoleplayRevealed(false);
  };

  const goFlash = idx => {
    setFlashIdx(idx);
    setFlashFlipped(false);
  };

  const setFlashTypeAndReset = type => {
    setFlashType(type);
    setFlashIdx(0);
    setFlashFlipped(false);
  };

  const copySalesforceNote = async () => {
    try {
      await navigator.clipboard.writeText(salesforceTemplate);
      setCopyStatus('Salesforce note template copied.');
    } catch {
      setCopyStatus('Copy failed. Select the template and copy it manually.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>
            <span className="brand-name">Vision Packaging</span>
            <span className="brand-product">10Q Sales Trainer</span>
          </span>
        </div>
      </header>

      <main className="content" id="training-content">
        {tab === 'Learn' && (
          <section className="card" aria-labelledby="learn-title">
            <PageIntro
              eyebrow="Learn the framework"
              id="learn-title"
              title="Learn the 10 questions"
              description="Understand why each question matters, then practice a natural way to ask it."
            />

            <div
              className="question-progress"
              role="progressbar"
              aria-label="Question progress"
              aria-valuemin="1"
              aria-valuemax={questions.length}
              aria-valuenow={learnIdx + 1}
            >
              <div className="question-progress-meta">
                <span>Question {current.id}</span>
                <span>{learnIdx + 1} of {questions.length}</span>
              </div>
              <span className="progress-track" aria-hidden="true">
                <span style={{ width: `${((learnIdx + 1) / questions.length) * 100}%` }} />
              </span>
            </div>

            <h3 className="question-title">{current.originalQuestion}</h3>
            <div className="lesson-section">
              <h4>Purpose</h4>
              <p>{current.purpose}</p>
            </div>
            <div className="lesson-section lesson-natural">
              <h4>Ask it naturally</h4>
              <p>{current.casualVersion}</p>
            </div>
            <div className="lesson-section">
              <h4>Useful follow-ups</h4>
              <ul>{current.followUps.map(followUp => <li key={followUp}>{followUp}</li>)}</ul>
            </div>
            <div className="lesson-grid">
              <div className="lesson-section lesson-warning">
                <h4>Common mistake</h4>
                <p>{current.commonMistake}</p>
              </div>
              <div className="lesson-section lesson-coaching">
                <h4>Coaching tip</h4>
                <p>{current.managerCoachingNote}</p>
              </div>
            </div>
            <div className="row">
              <button className="btn-outline" onClick={() => setLearnIdx((learnIdx + questions.length - 1) % questions.length)}>
                <ActionLabel icon="arrowLeft">Previous</ActionLabel>
              </button>
              <button onClick={() => setLearnIdx((learnIdx + 1) % questions.length)}>
                <ActionLabel icon="arrowRight">Next</ActionLabel>
              </button>
            </div>
          </section>
        )}

        {tab === 'Drill' && (
          <section className="card" aria-labelledby="drill-title">
            <PageIntro
              eyebrow="Test your recall"
              id="drill-title"
              title="Find the real 10Q questions"
              description="Select the 10 framework questions. Five of the options are decoys."
            />

            <div className={`selection-meter ${selectionComplete ? 'complete' : ''}`} aria-live="polite">
              <span><strong>{recallChecked.size} of 10</strong> selected</span>
              <span>{selectionComplete ? 'Ready to submit' : `${10 - recallChecked.size} remaining`}</span>
              <span className="selection-track" aria-hidden="true">
                <span style={{ width: `${recallChecked.size * 10}%` }} />
              </span>
            </div>

            <ul className="recall-list">
              {recallItems.map(item => {
                const checked = recallChecked.has(item.id);
                const unselectedAtLimit = selectionComplete && !checked;
                let status = '';
                if (recallSubmitted) {
                  if (item.isReal && checked) status = 'correct';
                  else if (item.isReal && !checked) status = 'missed';
                  else if (!item.isReal && checked) status = 'trap';
                }

                return (
                  <li key={item.id} className={`recall-item ${status}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(item.id)}
                        disabled={recallSubmitted || unselectedAtLimit}
                      />
                      <span>{item.text}</span>
                    </label>
                    {recallSubmitted && status === 'correct' && <span className="recall-badge"><Icon name="check" size={14} /> Correct</span>}
                    {recallSubmitted && status === 'missed' && <span className="recall-badge">Missed</span>}
                    {recallSubmitted && status === 'trap' && <span className="recall-badge">Decoy</span>}
                  </li>
                );
              })}
            </ul>

            {!recallSubmitted ? (
              <button onClick={() => setRecallSubmitted(true)} disabled={!selectionComplete}>
                Submit selections
              </button>
            ) : (
              <div className="recall-score" role="status" aria-live="polite">
                <p className="score-headline">
                  {recallResult.isPerfect
                    ? 'Perfect — all 10 questions, no decoys.'
                    : `${recallResult.correctReal} of 10 correct`}
                </p>
                {!recallResult.isPerfect && (
                  <p className="score-sub">
                    {recallResult.missedReal} missed
                    {recallResult.falsePositives > 0
                      ? ` · ${recallResult.falsePositives} decoy${recallResult.falsePositives === 1 ? '' : 's'} selected`
                      : ''}
                  </p>
                )}
                <button onClick={newRound}>Start a new round</button>
              </div>
            )}
          </section>
        )}

        {tab === 'Field' && (
          <section className="card field-card" aria-labelledby="field-title">
            <PageIntro
              eyebrow="Use it on a call"
              id="field-title"
              title="Field guide"
              description="Choose a customer type and follow the conversation from opening to next step."
            />

            <div className="field-controls">
              <label htmlFor="customer-type">Customer type</label>
              <select id="customer-type" value={customerType} onChange={event => setCustomerType(event.target.value)}>
                {customerTypes.map(customer => <option key={customer}>{customer}</option>)}
              </select>
            </div>

            <div className="field-opening">
              <div className="field-section-label">Opening</div>
              <p>{openingLines[customerType]}</p>
            </div>
            <ol className="field-questions">
              {questions.map(question => (
                <li key={question.id}>
                  <span className="field-qnum" aria-hidden="true">{question.id}</span>
                  <span className="field-qtext">{question.conversationVersions?.[customerType] ?? question.casualVersion}</span>
                </li>
              ))}
            </ol>
            <div className="field-closing">
              <div className="field-section-label">Close</div>
              <p>Would it make sense to get you a quote before your next order window?</p>
            </div>

            <div className="field-note-card">
              <div className="field-note-heading">
                <div>
                  <h3>Salesforce note template</h3>
                  <p>Copy this structure into the account record after the conversation.</p>
                </div>
                <button className="btn-outline copy-note-button" onClick={copySalesforceNote}>
                  <ActionLabel icon="copy">Copy</ActionLabel>
                </button>
              </div>
              <label className="sr-only" htmlFor="salesforce-note">Salesforce note template</label>
              <textarea id="salesforce-note" readOnly value={salesforceTemplate} />
              <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
            </div>
          </section>
        )}

        {tab === 'Roleplay' && (
          <section className="card" aria-labelledby="roleplay-title">
            <PageIntro
              eyebrow="Practice the moment"
              id="roleplay-title"
              title="Handle customer pushback"
              description="Say your response aloud before revealing the coaching."
            />

            <div className="scenario-meta">
              <span>Scenario {roleplayIdx + 1} of {scenarios.length}</span>
              <span>{scenario.setting}</span>
            </div>
            <div className="roleplay-customer">
              <span className="roleplay-label"><Icon name="messages" size={16} /> Customer</span>
              <p>“{scenario.customerLine}”</p>
            </div>
            <p className="roleplay-prompt">What do you say?</p>
            {!roleplayRevealed ? (
              <button className="reveal-btn" onClick={() => setRoleplayRevealed(true)}>
                <ActionLabel icon="eye">Reveal best response</ActionLabel>
              </button>
            ) : (
              <div className="roleplay-revealed" role="status" aria-live="polite">
                <div className="roleplay-response">
                  <span className="roleplay-label">Best response</span>
                  <p>“{scenario.bestResponse}”</p>
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
              <button className="btn-outline" onClick={() => goRoleplay((roleplayIdx + scenarios.length - 1) % scenarios.length)}>
                <ActionLabel icon="arrowLeft">Previous</ActionLabel>
              </button>
              <button
                className="btn-outline"
                onClick={() => goRoleplay(pickDifferentIndex(roleplayIdx, scenarios.length))}
              >
                <ActionLabel icon="shuffle">Random</ActionLabel>
              </button>
              <button onClick={() => goRoleplay((roleplayIdx + 1) % scenarios.length)}>
                <ActionLabel icon="arrowRight">Next</ActionLabel>
              </button>
            </div>
          </section>
        )}

        {tab === 'Flashcards' && (
          <section className="card" aria-labelledby="flashcards-title">
            <PageIntro
              eyebrow="Build fluency"
              id="flashcards-title"
              title="Flashcards"
              description="Flip through discovery questions or practice response patterns."
            />

            <div className="flash-toggle" role="group" aria-label="Flashcard deck">
              <button
                className={flashType === 'question' ? 'active' : ''}
                aria-pressed={flashType === 'question'}
                onClick={() => setFlashTypeAndReset('question')}
              >
                10Q cards
              </button>
              <button
                className={flashType === 'response' ? 'active' : ''}
                aria-pressed={flashType === 'response'}
                onClick={() => setFlashTypeAndReset('response')}
              >
                Response cards
              </button>
            </div>
            <p className="card-counter">{flashIdx + 1} of {flashDeck.length}</p>
            <button
              type="button"
              className={`flashcard ${flashType} ${flashFlipped ? 'flipped' : ''}`}
              aria-pressed={flashFlipped}
              aria-label={`${flashFlipped ? 'Hide' : 'Reveal'} answer for card ${flashIdx + 1}`}
              onClick={() => setFlashFlipped(flipped => !flipped)}
            >
              {!flashFlipped ? (
                <span className="flash-front">
                  <span className="flash-tag">{flashType === 'question' ? 'Q' : 'A'}</span>
                  <span className="flash-main-text">
                    {flashType === 'question' ? flashCard.originalQuestion : flashCard.customerSays}
                  </span>
                  <span className="flip-hint">Press to reveal</span>
                </span>
              ) : (
                <span className="flash-back">
                  {flashType === 'question' ? (
                    <>
                      <span className="flash-section">
                        <span className="flash-back-label">Purpose</span>
                        <span>{flashCard.purpose}</span>
                      </span>
                      <span className="flash-section">
                        <span className="flash-back-label">Two other ways to ask</span>
                        <span className="flash-alts">
                          {flashCard.alternateAsks.map((ask, index) => <span key={ask}>{index + 1}. “{ask}”</span>)}
                        </span>
                      </span>
                      <span className="flash-section flash-objection">
                        <span className="flash-back-label">If they resist answering</span>
                        <span>“{flashCard.objectionHandle}”</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Q{flashCard.questionId}: {flashCard.questionLabel}</strong>
                      <span>{flashCard.coaching}</span>
                    </>
                  )}
                  <span className="flip-hint">Press to flip back</span>
                </span>
              )}
            </button>
            <div className="row">
              <button className="btn-outline" onClick={() => goFlash((flashIdx + flashDeck.length - 1) % flashDeck.length)}>
                <ActionLabel icon="arrowLeft">Previous</ActionLabel>
              </button>
              <button onClick={() => goFlash((flashIdx + 1) % flashDeck.length)}>
                <ActionLabel icon="arrowRight">Next</ActionLabel>
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="tabs" aria-label="Training sections">
        {tabs.map(item => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
          >
            <Icon name={item.icon} size={22} className="nav-icon" />
            <span className={item.mobileLabel ? 'nav-label nav-label-responsive' : 'nav-label'}>
              <span className="nav-label-mobile">{item.mobileLabel ?? item.label}</span>
              {item.mobileLabel && <span className="nav-label-desktop">{item.label}</span>}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
