/* part5Store.js — nap du lieu Part 5 + quan ly phien thi */

const STORAGE_KEY = 'srs-part5-results-v1'
const part5Modules = import.meta.glob('../../part5_sets/*.json', { eager: true })

function modulePayload(moduleValue) {
  return moduleValue?.default ?? moduleValue
}

const PART5_SOURCES = Object.entries(part5Modules).map(([path, value]) => {
  const payload = modulePayload(value)
  return {
    test: payload.test || '',
    title: payload.title || '',
    questions: payload.questions || [],
  }
})

export function getPart5Catalog() {
  return PART5_SOURCES.map((s, i) => ({
    index: i + 1,
    test: s.test,
    title: s.title,
    count: s.questions.length,
  }))
}

export function getPart5Test(index) {
  const source = PART5_SOURCES[index - 1]
  if (!source) return null
  return {
    test: source.test,
    title: source.title,
    questions: source.questions,
  }
}

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function buildPart5Session(testIndex, options = {}) {
  const test = getPart5Test(testIndex)
  if (!test) return null

  let questions = [...test.questions]
  const maxQuestions = options.maxQuestions || questions.length
  questions = shuffleArray(questions).slice(0, Math.min(maxQuestions, questions.length))

  const sessionQuestions = questions.map((q, idx) => {
    const opts = shuffleArray(q.options)
    const correctText = q.options[q.answer]
    const newAnswer = opts.indexOf(correctText)
    return { ...q, index: idx, options: opts, answer: newAnswer }
  })

  return {
    testIndex,
    test: test.test,
    title: test.title,
    questions: sessionQuestions,
    currentIndex: 0,
    answers: [],
    startedAt: Date.now(),
  }
}

export function getPart5Results() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePart5Result(result) {
  try {
    const results = getPart5Results()
    results.unshift(result)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(0, 50)))
    return results
  } catch {
    return []
  }
}
