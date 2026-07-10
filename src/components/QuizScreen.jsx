import { useCallback, useMemo, useState } from 'react'
import {
  getQuizCatalog,
  buildQuizSession,
  saveQuizResult,
  getQuizTypeLabels,
} from '../lib/quizStore'
import './QuizScreen.css'

export default function QuizScreen({ onExit }) {
  const [view, setView] = useState('setup')
  const [session, setSession] = useState(null)
  const [config, setConfig] = useState({
    skill: 'reading',
    test: 'Test 1',
    maxQuestions: 20,
    typeFilter: 'all',
  })
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState(null)

  const catalog = useMemo(() => getQuizCatalog(), [])
  const typeLabels = useMemo(() => getQuizTypeLabels(), [])

  const startQuiz = useCallback(() => {
    const s = buildQuizSession(config.skill, config.test, {
      maxQuestions: config.maxQuestions,
      typeFilter: config.typeFilter,
    })
    if (!s || !s.questions.length) return
    setSession(s)
    setView('runner')
    setSelectedAnswer(null)
    setRevealed(false)
    setResults(null)
  }, [config])

  const currentQuestion = session ? session.questions[session.currentIndex] : null

  const handleAnswer = useCallback(
    (optionIndex) => {
      if (revealed || !currentQuestion) return
      setSelectedAnswer(optionIndex)
      setRevealed(true)
    },
    [revealed, currentQuestion]
  )

  const handleNext = useCallback(() => {
    if (!session) return
    const isCorrect = selectedAnswer === currentQuestion.answer
    const updatedAnswers = [
      ...session.answers,
      {
        questionIndex: session.currentIndex,
        selected: selectedAnswer,
        correct: isCorrect,
        question: currentQuestion,
      },
    ]

    const nextIndex = session.currentIndex + 1

    if (nextIndex >= session.questions.length) {
      const correctCount = updatedAnswers.filter((a) => a.correct).length
      const total = session.questions.length
      const scorePercent = Math.round((correctCount / total) * 100)
      const finalResult = {
        skill: session.skill,
        test: session.test,
        title: session.title,
        total,
        correct: correctCount,
        scorePercent,
        answers: updatedAnswers,
        completedAt: Date.now(),
      }
      setResults(finalResult)
      saveQuizResult(finalResult)
      setView('results')
    } else {
      setSession({ ...session, currentIndex: nextIndex, answers: updatedAnswers })
      setSelectedAnswer(null)
      setRevealed(false)
    }
  }, [session, selectedAnswer, currentQuestion])

  const restartQuiz = useCallback(() => {
    setView('setup')
    setSession(null)
    setSelectedAnswer(null)
    setRevealed(false)
    setResults(null)
  }, [])

  const testOptions = config.skill === 'reading' ? catalog.reading : catalog.listening

  if (view === 'setup') {
    return (
      <div className="quiz-screen">
        <div className="quiz-setup">
          <div className="quiz-setup-header">
            <button className="btn btn-ghost" onClick={onExit}>← Quay lại</button>
            <h2>Trắc nghiệm từ vựng</h2>
          </div>

          <div className="quiz-setup-body">
            <div className="quiz-config-group">
              <label className="quiz-config-label">Kỹ năng</label>
              <div className="quiz-skill-tabs">
                <button
                  className={`quiz-skill-tab ${config.skill === 'reading' ? 'active' : ''}`}
                  onClick={() => setConfig({ ...config, skill: 'reading', test: 'Test 1' })}
                >
                  📖 Reading ({catalog.reading.length} test)
                </button>
                <button
                  className={`quiz-skill-tab ${config.skill === 'listening' ? 'active' : ''}`}
                  onClick={() => setConfig({ ...config, skill: 'listening', test: 'Test 1' })}
                >
                  🎧 Listening ({catalog.listening.length} test)
                </button>
              </div>
            </div>

            <div className="quiz-config-group">
              <label className="quiz-config-label">Chọn Test</label>
              <div className="quiz-test-grid">
                {testOptions.map((t) => (
                  <button
                    key={t.test}
                    className={`quiz-test-card ${config.test === t.test ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, test: t.test })}
                  >
                    <span className="quiz-test-name">{t.test}</span>
                    <span className="quiz-test-count">{t.count} câu</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-config-row">
              <div className="quiz-config-group">
                <label className="quiz-config-label">Số câu hỏi</label>
                <select
                  className="quiz-select"
                  value={config.maxQuestions}
                  onChange={(e) => setConfig({ ...config, maxQuestions: Number(e.target.value) })}
                >
                  <option value={10}>10 câu</option>
                  <option value={20}>20 câu</option>
                  <option value={30}>30 câu</option>
                  <option value={50}>50 câu</option>
                  <option value={999}>Tất cả</option>
                </select>
              </div>

              <div className="quiz-config-group">
                <label className="quiz-config-label">Loại câu hỏi</label>
                <select
                  className="quiz-select"
                  value={config.typeFilter}
                  onChange={(e) => setConfig({ ...config, typeFilter: e.target.value })}
                >
                  <option value="all">Đa dạng (tất cả)</option>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btn btn-primary quiz-start-btn" onClick={startQuiz}>
              Bắt đầu trắc nghiệm →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'runner' && currentQuestion) {
    const progress = ((session.currentIndex + 1) / session.questions.length) * 100
    const correctSoFar = session.answers.filter((a) => a.correct).length

    return (
      <div className="quiz-screen">
        <div className="quiz-runner">
          <div className="quiz-runner-topbar">
            <button className="btn btn-ghost" onClick={restartQuiz}>✕ Thoát</button>
            <div className="quiz-runner-progress">
              <span className="quiz-progress-text">
                Câu {session.currentIndex + 1}/{session.questions.length} · Đúng {correctSoFar}/{session.currentIndex}
              </span>
              <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="quiz-question-card">
            <div className="quiz-question-meta">
              <span className="quiz-badge">{typeLabels[currentQuestion.type] || currentQuestion.type}</span>
              {currentQuestion.sub ? <span className="quiz-sub">{currentQuestion.sub}</span> : null}
            </div>

            <div className="quiz-question-text">
              {currentQuestion.question.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className="quiz-options">
              {currentQuestion.options.map((opt, i) => {
                let cls = 'quiz-option'
                if (revealed) {
                  if (i === currentQuestion.answer) cls += ' correct'
                  else if (i === selectedAnswer) cls += ' wrong'
                  else cls += ' disabled'
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={revealed}
                    onClick={() => handleAnswer(i)}
                  >
                    <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="quiz-option-text">{opt}</span>
                    {revealed && i === currentQuestion.answer ? <span className="quiz-option-mark">✓</span> : null}
                    {revealed && i === selectedAnswer && i !== currentQuestion.answer ? <span className="quiz-option-mark">✗</span> : null}
                  </button>
                )
              })}
            </div>

            {revealed ? (
              <div className="quiz-feedback">
                <div className={`quiz-feedback-result ${selectedAnswer === currentQuestion.answer ? 'correct' : 'wrong'}`}>
                  {selectedAnswer === currentQuestion.answer ? '✓ Chính xác!' : '✗ Chưa đúng'}
                </div>
                <div className="quiz-feedback-explanation">
                  {currentQuestion.explanation.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <button className="btn btn-primary quiz-next-btn" onClick={handleNext}>
                  {session.currentIndex + 1 >= session.questions.length ? 'Xem kết quả →' : 'Câu tiếp →'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'results' && results) {
    return (
      <div className="quiz-screen">
        <div className="quiz-results">
          <div className="quiz-results-header">
            <h2>Kết quả trắc nghiệm</h2>
            <p className="quiz-results-sub">{results.title}</p>
          </div>

          <div className="quiz-score-card">
            <div className={`quiz-score-circle ${results.scorePercent >= 80 ? 'great' : results.scorePercent >= 50 ? 'ok' : 'low'}`}>
              <span className="quiz-score-percent">{results.scorePercent}%</span>
            </div>
            <div className="quiz-score-detail">
              <div className="quiz-score-stat">
                <span className="quiz-score-stat-value">{results.correct}/{results.total}</span>
                <span className="quiz-score-stat-label">câu đúng</span>
              </div>
              <div className="quiz-score-stat">
                <span className="quiz-score-stat-value">{results.total - results.correct}</span>
                <span className="quiz-score-stat-label">câu sai</span>
              </div>
            </div>
          </div>

          <div className="quiz-results-actions">
            <button className="btn btn-primary" onClick={startQuiz}>Làm lại</button>
            <button className="btn btn-secondary" onClick={restartQuiz}>Chọn test khác</button>
            <button className="btn btn-ghost" onClick={onExit}>Về trang chính</button>
          </div>

          <div className="quiz-review">
            <h3>Xem lại đáp án</h3>
            {results.answers.map((a, i) => (
              <div key={i} className={`quiz-review-item ${a.correct ? 'correct' : 'wrong'}`}>
                <div className="quiz-review-header">
                  <span className="quiz-review-num">{i + 1}</span>
                  <span className="quiz-review-status">{a.correct ? '✓ Đúng' : '✗ Sai'}</span>
                  <span className="quiz-review-type">{typeLabels[a.question.type] || a.question.type}</span>
                </div>
                <div className="quiz-review-question">{a.question.question.split('\n')[0]}</div>
                <div className="quiz-review-answers">
                  {!a.correct && a.selected != null ? (
                    <div className="quiz-review-answer wrong">
                      Đáp án của bạn: {a.question.options[a.selected]}
                    </div>
                  ) : null}
                  <div className="quiz-review-answer correct">
                    Đáp án đúng: {a.question.options[a.question.answer]}
                  </div>
                </div>
                {a.question.explanation ? (
                  <div className="quiz-review-explanation">{a.question.explanation.split('\n')[0]}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
