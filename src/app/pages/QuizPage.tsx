import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Trophy, RotateCcw, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { fadeInUp, ease } from "@/app/lib/motion"
import confetti from "canvas-confetti"
import { api } from "@/app/lib/api"
import { toast } from "sonner"

type QuizState = "answering" | "revealed" | "complete"

export function QuizPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({})
  const [state, setState] = useState<QuizState>("answering")
  const [score, setScore] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [passed, setPassed] = useState(false)
  const [certificate, setCertificate] = useState<any>(null)

  useEffect(() => {
    if (!lessonId) return
    api.get(`/lessons/${lessonId}/quiz`)
      .then(data => {
        setQuiz(data)
        const qList = (data.questions || []).map((q: any) => ({
          id: q.id,
          text: q.question_text || q.text,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            text: o.option_text || o.text,
            correct: o.is_correct || o.correct
          }))
        }))
        setQuestions(qList)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [lessonId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-400">Loading quiz...</p>
      </div>
    )
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Quiz</h2>
        <p className="text-slate-400 text-center max-w-md mb-6">{error || "No quiz found for this lesson."}</p>
        <Button onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}`)}>Back to Lesson</Button>
      </div>
    )
  }

  const question = questions[currentQ]
  const selectedOption = selectedAnswers[question.id]
  const progressPct = ((currentQ + 1) / questions.length) * 100

  function handleSelect(option: any) {
    if (selectedAnswers[question.id]) return
    setSelectedAnswers(prev => ({ ...prev, [question.id]: option }))
  }

  async function handleNext() {
    setDirection(1)
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      // Submit quiz to backend
      setSubmitting(true)
      const answersMap: Record<string, string> = {}
      Object.entries(selectedAnswers).forEach(([qId, opt]) => {
        answersMap[qId] = opt.id.toString()
      })

      try {
        const result = await api.post(`/lessons/${lessonId}/quiz/submit`, {
          answers: answersMap
        })

        // Calculate score
        const correctCount = Object.values(selectedAnswers).filter(opt => opt.correct).length
        setScore(correctCount)
        setPassed(result.passed)
        setCertificate(result.certificate)
        setState("complete")

        if (result.passed) {
          setTimeout(() => {
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#6366f1", "#8b5cf6", "#a78bfa"]
            })
          }, 300)
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to submit quiz answers")
      } finally {
        setSubmitting(false)
      }
    }
  }

  function handlePrev() {
    setDirection(-1)
    if (currentQ > 0) setCurrentQ(q => q - 1)
  }

  function handleRetry() {
    setSelectedAnswers({})
    setCurrentQ(0)
    setState("answering")
    setScore(0)
    setPassed(false)
  }

  if (state === "complete") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <motion.div {...fadeInUp} className="max-w-md w-full text-center">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? "bg-success/10" : "bg-error/10"}`}>
            {passed
              ? <Trophy className="h-12 w-12 text-success" />
              : <XCircle className="h-12 w-12 text-error" />
            }
          </div>
          <h1 className="text-white mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700 }}>
            {passed ? "Great Work!" : "Keep Practicing!"}
          </h1>
          <p className="text-slate-400 mb-8">
            {passed ? "You've passed this quiz and unlocked the next lesson!" : "You need 100% correct answers to pass. Review the material and try again."}
          </p>

          {/* Score circle */}
          <div className="relative h-40 w-40 mx-auto mb-8">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
              <motion.circle
                cx="50" cy="50" r="40" fill="none"
                stroke={passed ? "#10b981" : "#ef4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / questions.length) }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-bold text-white shadow-sm" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem" }}>
                {Math.round((score / questions.length) * 100)}%
              </span>
              <span className="text-slate-400 text-sm">{score}/{questions.length} correct</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl gap-2 border-slate-700 hover:bg-slate-800" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4" /> Try Again
            </Button>
            {passed && (
              <Button className="flex-1 rounded-xl gap-2" onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}`)}>
                Return <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between bg-slate-900">
        <button
          onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}`)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Exit Quiz
        </button>
        <div className="text-sm font-medium text-slate-300">
          Question {currentQ + 1} of {questions.length}
        </div>
        <div className="w-24" />
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-800">
        <motion.div
          className="h-full bg-brand-500 rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Question card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 30 }}
              transition={ease}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-raised overflow-hidden"
            >
              {/* Question header */}
              <div className="p-6 pb-4 border-b border-slate-800">
                <div className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-3">
                  Question {currentQ + 1}
                </div>
                <h2 className="text-white leading-relaxed" style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 600 }}>
                  {question.text}
                </h2>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2.5">
                {question.options.map((option: any) => {
                  const isSelected = selectedOption?.id === option.id
                  const showResult = !!selectedOption

                  let optionClass = "border-slate-850 bg-slate-900 text-slate-400 hover:border-primary/40 hover:text-white"
                  if (showResult) {
                    if (isSelected && option.correct) optionClass = "border-success bg-success/10 text-success"
                    else if (isSelected && !option.correct) optionClass = "border-error bg-error/10 text-error"
                    else if (!isSelected && option.correct) optionClass = "border-success bg-success/5 text-success"
                    else optionClass = "border-slate-850 bg-slate-950 text-slate-600"
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      disabled={showResult}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${optionClass} disabled:cursor-not-allowed`}
                    >
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                        showResult && isSelected && option.correct ? "border-success bg-success text-white" :
                        showResult && isSelected && !option.correct ? "border-error bg-error text-white" :
                        showResult && !isSelected && option.correct ? "border-success" :
                        "border-current"
                      }`}>
                        {showResult && isSelected && option.correct && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {showResult && isSelected && !option.correct && <XCircle className="h-3.5 w-3.5" />}
                        {(!showResult || (!isSelected && !option.correct)) && option.id.toString().slice(0, 1).toUpperCase()}
                        {showResult && !isSelected && option.correct && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                      </div>
                      <span style={{ fontSize: "0.9375rem" }}>{option.text}</span>
                    </button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="px-4 pb-4 flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl gap-2 border-slate-700 hover:bg-slate-800"
                  onClick={handlePrev}
                  disabled={currentQ === 0}
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  className="rounded-xl gap-2 bg-brand-500 hover:bg-brand-600 text-white"
                  onClick={handleNext}
                  disabled={!selectedOption || submitting}
                >
                  {submitting ? "Submitting..." : currentQ === questions.length - 1 ? "Submit Quiz" : "Next"}
                  {currentQ < questions.length - 1 && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
