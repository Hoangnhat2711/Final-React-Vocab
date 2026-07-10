/* quizStore.js — nap du lieu trac nghiem + quan ly phien quiz + luu ket qua */

const STORAGE_KEY = 'srs-quiz-results-v1'
const quizModules = import.meta.glob('../../quiz_sets/*.json', { eager: true })

function modulePayload(moduleValue) {
  return moduleValue?.default ?? moduleValue
}

const QUIZ_SOURCES = Object.entries(quizModules).map(([path, value]) => {
  const payload = modulePayload(value)
  return {
    path,
    skill: payload.skill || 'unknown',
    test: payload.test || '',
    title: payload.title || '',
    questions: payload.questions || [],
  }
})

export function getQuizCatalog() {
  const reading = QUIZ_SOURCES.filter((s) => s.skill === 'reading').map((s) => ({
    skill: s.skill,
    test: s.test,
    title: s.title,
    count: s.questions.length,
    fileName: s.path.split('/').pop(),
  }))
  const listening = QUIZ_SOURCES.filter((s) => s.skill === 'listening').map((s) => ({
    skill: s.skill,
    test: s.test,
    title: s.title,
    count: s.questions.length,
    fileName: s.path.split('/').pop(),
  }))
  return { reading, listening }
}

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function getQuizSet(skill, test) {
  const source = QUIZ_SOURCES.find((s) => s.skill === skill && s.test === test)
  if (!source) return null
  return {
    skill: source.skill,
    test: source.test,
    title: source.title,
    questions: source.questions,
  }
}

export function buildQuizSession(skill, test, options = {}) {
  const quizSet = getQuizSet(skill, test)
  if (!quizSet) return null

  let questions = [...quizSet.questions]

  const typeFilter = options.typeFilter
  if (typeFilter && typeFilter !== 'all') {
    questions = questions.filter((q) => q.type === typeFilter)
  }

  const maxQuestions = options.maxQuestions || questions.length
  questions = shuffleArray(questions).slice(0, Math.min(maxQuestions, questions.length))

  const sessionQuestions = questions.map((q, idx) => {
    const opts = shuffleArray(q.options)
    const correctText = q.options[q.answer]
    const newAnswer = opts.indexOf(correctText)
    return {
      ...q,
      index: idx,
      options: opts,
      answer: newAnswer,
    }
  })

  return {
    skill,
    test,
    title: quizSet.title,
    questions: sessionQuestions,
    currentIndex: 0,
    answers: [],
    startedAt: Date.now(),
  }
}

export function getQuizResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveQuizResult(result) {
  try {
    const results = getQuizResults()
    results.unshift(result)
    const trimmed = results.slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    return trimmed
  } catch {
    return []
  }
}

export function getQuizTypeLabels() {
  return {
    meaning: 'Chọn nghĩa tiếng Việt',
    word: 'Chọn từ tiếng Anh',
    fill_blank: 'Điền từ vào chỗ trống',
    pos: 'Xác định từ loại',
    definition: 'Chọn theo định nghĩa Anh',
    closest_meaning: 'Nghĩa gần nhất',
    synonym_antonym: 'Đồng nghĩa / trái nghĩa',
    collocation: 'Collocation / cụm từ',
    context: 'Ngữ cảnh sử dụng',
    odd_one_out: 'Tìm từ khác nhóm',
    usage_check: 'Chọn câu đúng',
    substitution: 'Từ thay thế',
  }
}
