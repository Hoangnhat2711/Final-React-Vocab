import { useCallback, useMemo, useState } from 'react'
import {
  getPart5Catalog,
  buildPart5Session,
  savePart5Result,
} from '../lib/part5Store'
import './Part5Screen.css'

export default function Part5Screen({ onExit }) {
  const [view, setView] = useState('setup')
  const [session, setSession] = useState(null)
  const [testIndex, setTestIndex] = useState(1)
  const [maxQuestions, setMaxQuestions] = useState(30)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState(null)

  const catalog = useMemo(() => getPart5Catalog(), [])

  const startTest = useCallback(() => {
    const s = buildPart5Session(testIndex, { maxQuestions })
    if (!s) return
    setSession(s)
    setView('runner')
    setSelected(null)
    setRevealed(false)
    setResults(null)
  }, [testIndex, maxQuestions])

  const currentQ = session ? session.questions[session.currentIndex] : null

  const handleAnswer = useCallback((i) => {
    if (revealed || !currentQ) return
    setSelected(i)
    setRevealed(true)
  }, [revealed, currentQ])

  const handleNext = useCallback(() => {
    if (!session) return
    const isCorrect = selected === currentQ.answer
    const updatedAnswers = [...session.answers, {
      questionIndex: session.currentIndex,
      selected,
      correct: isCorrect,
      question: currentQ,
    }]

    const nextIndex = session.currentIndex + 1
    if (nextIndex >= session.questions.length) {
      const correct = updatedAnswers.filter(a => a.correct).length
      const total = session.questions.length
      const final = {
        test: session.test,
        title: session.title,
        total, correct,
        scorePercent: Math.round((correct / total) * 100),
        answers: updatedAnswers,
        completedAt: Date.now(),
      }
      setResults(final)
      savePart5Result(final)
      setView('results')
    } else {
      setSession({ ...session, currentIndex: nextIndex, answers: updatedAnswers })
      setSelected(null)
      setRevealed(false)
    }
  }, [session, selected, currentQ])

  const exitToSetup = useCallback(() => {
    setView('setup')
    setSession(null)
    setSelected(null)
    setRevealed(false)
    setResults(null)
  }, [])

  if (view === 'setup') {
    return (
      <div className="p5-screen">
        <div className="p5-setup">
          <div className="p5-setup-header">
            <button className="btn btn-ghost" onClick={onExit}>← Quay lại</button>
            <h2>Luyện thi TOEIC Part 5</h2>
            <p className="p5-setup-sub">Incomplete Sentences · 10 đề · 300 câu · Có giải thích & mẹo</p>
          </div>

          <div className="p5-test-grid">
            {catalog.map((t) => (
              <button
                key={t.index}
                className={`p5-test-card ${testIndex === t.index ? 'active' : ''}`}
                onClick={() => setTestIndex(t.index)}
              >
                <span className="p5-test-num">Đề {t.index}</span>
                <span className="p5-test-count">{t.count} câu</span>
              </button>
            ))}
          </div>

          <div className="p5-config-row">
            <label className="p5-config-item">
              <span>Số câu/lần</span>
              <select value={maxQuestions} onChange={(e) => setMaxQuestions(Number(e.target.value))}>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
                <option value={30}>30 câu (đầy đủ)</option>
              </select>
            </label>
          </div>

          <button className="btn btn-primary p5-start-btn" onClick={startTest}>
            Bắt đầu luyện Part 5 →
          </button>
        </div>
      </div>
    )
  }

  if (view === 'runner' && currentQ) {
    const progress = ((session.currentIndex + 1) / session.questions.length) * 100
    const correctSoFar = session.answers.filter(a => a.correct).length

    return (
      <div className="p5-screen">
        <div className="p5-runner">
          <div className="p5-runner-topbar">
            <button className="btn btn-ghost" onClick={exitToSetup}>✕ Thoát</button>
            <div className="p5-runner-progress">
              <span className="p5-progress-text">
                Câu {session.currentIndex + 1}/{session.questions.length} · Đúng {correctSoFar}/{session.currentIndex}
              </span>
              <div className="p5-progress-bar">
                <div className="p5-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="p5-question-card">
            <div className="p5-question-meta">
              <span className="p5-badge">{currentQ.type_label || currentQ.type}</span>
            </div>

            <div className="p5-question-text">
              <span className="p5-q-num">{session.currentIndex + 1}.</span> {currentQ.question}
            </div>

            <div className="p5-options">
              {currentQ.options.map((opt, i) => {
                let cls = 'p5-option'
                if (revealed) {
                  if (i === currentQ.answer) cls += ' correct'
                  else if (i === selected) cls += ' wrong'
                  else cls += ' disabled'
                }
                return (
                  <button key={i} className={cls} disabled={revealed} onClick={() => handleAnswer(i)}>
                    <span className="p5-opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="p5-opt-text">{opt}</span>
                  </button>
                )
              })}
            </div>

            {revealed && (
              <div className="p5-feedback">
                <div className={`p5-feedback-result ${selected === currentQ.answer ? 'correct' : 'wrong'}`}>
                  {selected === currentQ.answer ? '✓ Chính xác!' : `✗ Đáp án đúng: ${String.fromCharCode(65 + currentQ.answer)}`}
                </div>
                <div className="p5-feedback-expl">
                  <strong>Giải thích:</strong> {currentQ.explanation}
                </div>
                {currentQ.tip && (
                  <div className="p5-feedback-tip">
                    <strong>💡 Mẹo:</strong> {currentQ.tip}
                  </div>
                )}
                <button className="btn btn-primary p5-next-btn" onClick={handleNext}>
                  {session.currentIndex + 1 >= session.questions.length ? 'Xem kết quả →' : 'Câu tiếp →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'results' && results) {
    return (
      <div className="p5-screen">
        <div className="p5-results">
          <div className="p5-results-header">
            <h2>Kết quả Part 5</h2>
            <p>{results.title}</p>
          </div>

          <div className="p5-score-card">
            <div className={`p5-score-circle ${results.scorePercent >= 70 ? 'great' : results.scorePercent >= 50 ? 'ok' : 'low'}`}>
              <span className="p5-score-pct">{results.scorePercent}%</span>
            </div>
            <div className="p5-score-stats">
              <div className="p5-score-stat"><span className="val">{results.correct}</span><span className="lbl">Đúng</span></div>
              <div className="p5-score-stat"><span className="val">{results.total - results.correct}</span><span className="lbl">Sai</span></div>
            </div>
          </div>

          <div className="p5-results-actions">
            <button className="btn btn-primary" onClick={startTest}>Làm lại</button>
            <button className="btn btn-secondary" onClick={exitToSetup}>Chọn đề khác</button>
            <button className="btn btn-ghost" onClick={onExit}>Về trang chính</button>
          </div>

          <div className="p5-review">
            <h3>Xem lại đáp án & giải thích</h3>
            {results.answers.map((a, i) => (
              <div key={i} className={`p5-review-item ${a.correct ? 'correct' : 'wrong'}`}>
                <div className="p5-review-head">
                  <span className="p5-review-num">{i + 1}</span>
                  <span className="p5-review-status">{a.correct ? '✓' : '✗'}</span>
                  <span className="p5-review-type">{a.question.type_label}</span>
                </div>
                <div className="p5-review-q">{a.question.question}</div>
                <div className="p5-review-ans correct">Đúng: ({String.fromCharCode(65 + a.question.answer)}) {a.question.options[a.question.answer]}</div>
                {!a.correct && a.selected != null && (
                  <div className="p5-review-ans wrong">Bạn chọn: ({String.fromCharCode(65 + a.selected)}) {a.question.options[a.selected]}</div>
                )}
                <div className="p5-review-expl">{a.question.explanation}</div>
                {a.question.tip && <div className="p5-review-tip">💡 {a.question.tip}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
