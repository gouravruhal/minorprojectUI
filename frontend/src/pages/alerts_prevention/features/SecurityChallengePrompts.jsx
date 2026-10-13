import React, { useState } from 'react';
import { CheckCircle, Lightbulb } from 'lucide-react';
import './SecurityChallengePrompts.css';

const CHALLENGE_QUESTIONS = [
  {
    id: 'ch-1',
    category: 'Biomechanical Glottal Test',
    prompt: 'Please recite your 4-digit employee authorization code in reverse order.',
    vulnerabilityTargeted: 'Neural models struggle with spontaneous reverse sequencing and exhibit unnatural pause latency (>1200ms).'
  },
  {
    id: 'ch-2',
    category: 'Phonetic Articulation Stress',
    prompt: 'Could you spell the second word of your department title phonetically?',
    vulnerabilityTargeted: 'Forces zero-shot TTS synthesizers to generate out-of-vocabulary phoneme transitions.'
  },
  {
    id: 'ch-3',
    category: 'Out-of-Band Physical Anchor',
    prompt: 'Who was seated directly opposite you during the last monthly executive review?',
    vulnerabilityTargeted: 'Social engineering attacker cannot retrieve spontaneous episodic memory on the fly.'
  }
];

export function SecurityChallengePrompts() {
  const [activeChallenge, setActiveChallenge] = useState(CHALLENGE_QUESTIONS[0]);
  const [completedList, setCompletedList] = useState([]);

  const toggleComplete = (id) => {
    if (completedList.includes(id)) {
      setCompletedList(completedList.filter(item => item !== id));
    } else {
      setCompletedList([...completedList, id]);
    }
  };

  return (
    <div className="security-challenge-prompts glass-panel" id="challenge-prompts-card">
      <div className="challenge-header">
        <div className="title-row">
          <Lightbulb size={18} className="icon-warn" />
          <h3 className="challenge-heading">AI Counter-Interrogation Prompts</h3>
        </div>
        <span className="badge badge-neutral">Frontline Operator Tool</span>
      </div>

      <p className="challenge-desc">
        Verbal cognitive tests designed to expose neural latency, lack of episodic memory, and phoneme synthesis glitches in live AI clones.
      </p>

      <div className="challenge-list">
        {CHALLENGE_QUESTIONS.map((ch) => {
          const isDone = completedList.includes(ch.id);
          const isSelected = activeChallenge.id === ch.id;

          return (
            <div
              key={ch.id}
              className={`challenge-card ${isSelected ? 'selected' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => setActiveChallenge(ch)}
            >
              <div className="card-top">
                <span className="category-tag">{ch.category}</span>
                <button
                  className="check-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(ch.id);
                  }}
                  title="Mark prompt as asked"
                >
                  {isDone ? (
                    <CheckCircle size={16} className="text-safe" />
                  ) : (
                    <div className="check-empty" />
                  )}
                </button>
              </div>
              <p className="prompt-text">"{ch.prompt}"</p>
              {isSelected && (
                <div className="target-note">
                  <span className="note-label">Target Glitch:</span>
                  <span className="note-text">{ch.vulnerabilityTargeted}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
