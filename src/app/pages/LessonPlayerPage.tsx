import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Play, Pause, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, BookOpen, FileText, Download,
  ArrowLeft, List, X, SkipForward, AlertCircle
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { fadeInUp, slideInRight } from "@/app/lib/motion"
import { api } from "@/app/lib/api"
import { toast } from "sonner"

export function LessonPlayerPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [completing, setCompleting] = useState(false)

  const fetchCourse = () => {
    if (!courseId) return
    api.get(`/courses/${courseId}`)
      .then(data => {
        setCourse(data)
        setLoading(false)
        
        // Find current or active lesson
        const lessonsList = data.lessons || []
        let selectedLesson = lessonsList.find((l: any) => l.id.toString() === lessonId)
        if (!selectedLesson && lessonsList.length > 0) {
          selectedLesson = lessonsList[0]
        }
        setActiveLesson(selectedLesson)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchCourse()
  }, [courseId, lessonId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-400">Loading course player...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
        <p className="text-slate-400 text-center max-w-md mb-6">{error || "Course not found."}</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    )
  }

  const lessons = course.lessons || []
  const enrollment = course.enrollment
  const completedLessonIds = enrollment
    ? (enrollment.progresses || []).map((p: any) => p.lesson_id)
    : []

  const isCompleted = (lId: number) => completedLessonIds.includes(lId)

  const activeIndex = lessons.findIndex((l: any) => l.id === activeLesson?.id)
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null

  // Calculate overall course progress
  const completedCount = lessons.filter((l: any) => isCompleted(l.id)).length
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  const handleMarkComplete = async () => {
    if (!activeLesson) return
    setCompleting(true)
    try {
      await api.post(`/lessons/${activeLesson.id}/complete`)
      toast.success("Lesson marked as complete!")
      fetchCourse()
    } catch (err: any) {
      toast.error(err.message || "Failed to complete lesson")
    } finally {
      setCompleting(false)
    }
  }

  const handleLessonClick = (lesson: any) => {
    setActiveLesson(lesson)
    navigate(`/courses/${courseId}/lessons/${lesson.id}`)
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <div className="hidden sm:block text-slate-400 text-sm">
              <span className="text-slate-500">{course.title}</span>
              <span className="text-slate-600 mx-2">›</span>
              <span className="text-slate-300">{activeLesson?.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-slate-400 text-xs">{progressPercent}% complete</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(s => !s)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Video + content */}
        <div className="flex-1 overflow-y-auto">
          {/* Video */}
          <div className="bg-slate-900 relative" style={{ aspectRatio: "16/9", maxHeight: "55vh" }}>
            {activeLesson?.video_url ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                {/* Embed video or render responsive video player */}
                <iframe
                  src={activeLesson.video_url.replace("watch?v=", "embed/")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-slate-700/80 transition-colors"
                    onClick={() => setPlaying(p => !p)}>
                    {playing
                      ? <Pause className="h-8 w-8 text-white" />
                      : <Play className="h-8 w-8 text-white ml-1" />
                    }
                  </div>
                  <p className="text-slate-500 text-sm">{activeLesson?.title || "No video content"}</p>
                </div>
              </div>
            )}

            {/* Traditional Video Progress controls if no video_url but playing state */}
            {!activeLesson?.video_url && (
              <div
                className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
              >
                <div className="relative h-1 bg-slate-600 rounded-full cursor-pointer mb-2"
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setVideoProgress(Math.round(((e.clientX - rect.left) / rect.width) * 100))
                  }}
                >
                  <div className="h-full bg-brand-500 rounded-full relative" style={{ width: `${videoProgress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPlaying(p => !p)} className="text-white hover:text-brand-300 transition-colors">
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setMuted(m => !m)} className="text-white hover:text-brand-300 transition-colors">
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <span className="text-xs text-slate-400">0:00 / 10:00</span>
                  </div>
                  <button className="text-white hover:text-brand-300 transition-colors">
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Resources */}
          <div className="p-5 max-w-3xl">
            <h1 className="text-white mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700 }}>
              {activeLesson?.title}
            </h1>

            <Tabs defaultValue="notes" className="mt-4">
              <TabsList className="bg-slate-800 border-0">
                <TabsTrigger value="notes" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                  <FileText className="h-4 w-4 mr-1.5" /> Notes
                </TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                  <Download className="h-4 w-4 mr-1.5" /> Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4">
                <div className="text-slate-300 leading-relaxed whitespace-pre-line" style={{ fontSize: "0.9375rem" }}>
                  {activeLesson?.description || "No description provided for this lesson."}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">No downloadable resources for this lesson.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950 shrink-0">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl gap-2"
            disabled={!prevLesson}
            onClick={() => prevLesson && handleLessonClick(prevLesson)}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-3">
            {activeLesson && !isCompleted(activeLesson.id) ? (
              <Button
                className="rounded-xl gap-2 bg-success hover:bg-success/90 text-white"
                onClick={handleMarkComplete}
                disabled={completing}
              >
                <CheckCircle2 className="h-4 w-4" /> {completing ? "Completing..." : "Mark Complete"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Completed!
              </div>
            )}
            
            {activeLesson?.quiz ? (
              <Link to={`/courses/${courseId}/lessons/${activeLesson.id}/quiz`}>
                <Button className="rounded-xl gap-2 bg-purple-600 hover:bg-purple-700">
                  Take Lesson Quiz <SkipForward className="h-4 w-4" />
                </Button>
              </Link>
            ) : nextLesson ? (
              <Button
                className="rounded-xl gap-2"
                onClick={() => handleLessonClick(nextLesson)}
              >
                Next Lesson <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="rounded-xl gap-2" variant="outline" onClick={() => navigate("/dashboard")}>
                Finish Course
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Course outline sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            {...slideInRight}
            className="w-72 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-800">
              <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-heading)" }}>Course Outline</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-slate-500 text-xs shrink-0">{completedCount}/{lessons.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-2.5 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Lessons</span>
              </div>
              {lessons.map((lesson: any) => {
                const isActive = lesson.id === activeLesson?.id
                const lessonCompleted = isCompleted(lesson.id)
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-brand-500/10 border-l-2 border-brand-500"
                        : "border-l-2 border-transparent hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {lessonCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : lesson.quiz ? (
                        <div className="h-4 w-4 rounded-sm border border-slate-600 flex items-center justify-center">
                          <SkipForward className="h-2.5 w-2.5 text-slate-500" />
                        </div>
                      ) : (
                        <Circle className={`h-4 w-4 ${isActive ? "text-brand-400" : "text-slate-600"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${isActive ? "text-brand-300" : lessonCompleted ? "text-slate-400" : "text-slate-300"}`}>
                        {lesson.title}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {lesson.quiz ? "Contains Quiz" : "Video"}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
