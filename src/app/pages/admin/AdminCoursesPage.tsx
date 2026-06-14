import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  BookOpen, Plus, ChevronDown, ChevronUp, Eye, EyeOff,
  Loader2, AlertCircle, Check, X, Trash2, Video
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState<number | null>(null)

  // Create course form
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDesc, setCourseDesc] = useState("")
  const [coursePrice, setCoursePrice] = useState("")
  const [creatingCourse, setCreatingCourse] = useState(false)

  // Add lesson form
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonDesc, setLessonDesc] = useState("")
  const [lessonVideoUrl, setLessonVideoUrl] = useState("")
  const [addingLesson, setAddingLesson] = useState(false)

  const fetchCourses = async () => {
    try {
      const data = await api.get("/courses?my_courses=true")
      const list = Array.isArray(data) ? data : []
      // For each course, also fetch detail to get lessons
      const withLessons = await Promise.all(
        list.map(async (c: any) => {
          try {
            const detail = await api.get(`/courses/${c.id}`)
            return { ...c, lessons: detail.lessons || [], enrollment: detail.enrollment }
          } catch {
            return c
          }
        })
      )
      setCourses(withLessons)
    } catch (err: any) {
      toast.error("Failed to load courses: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingCourse(true)
    try {
      const res = await api.post("/courses", {
        course: {
          title: courseTitle,
          description: courseDesc,
          price_cents: Math.round(parseFloat(coursePrice || "0") * 100),
          is_active: true
        }
      })
      toast.success("Course created!")
      setCourseTitle(""); setCourseDesc(""); setCoursePrice("")
      setShowCreateCourse(false)
      setCourses(prev => [{ ...res, lessons: [] }, ...prev])
    } catch (err: any) {
      toast.error(err.message || "Failed to create course")
    } finally {
      setCreatingCourse(false)
    }
  }

  const handleTogglePublish = async (course: any) => {
    try {
      const newActive = !course.is_active
      await api.patch(`/courses/${course.id}`, { course: { is_active: newActive } })
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_active: newActive } : c))
      toast.success(newActive ? "Course published!" : "Course unpublished")
    } catch (err: any) {
      toast.error(err.message || "Failed to update course")
    }
  }

  const handleAddLesson = async (e: React.FormEvent, courseId: number) => {
    e.preventDefault()
    setAddingLesson(true)
    try {
      const res = await api.post("/lessons", {
        lesson: {
          course_id: courseId,
          title: lessonTitle,
          description: lessonDesc,
          video_url: lessonVideoUrl || undefined
        }
      })
      toast.success("Lesson added!")
      setLessonTitle(""); setLessonDesc(""); setLessonVideoUrl("")
      setShowAddLesson(null)
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, lessons: [...(c.lessons || []), res] } : c
      ))
    } catch (err: any) {
      toast.error(err.message || "Failed to add lesson")
    } finally {
      setAddingLesson(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-foreground">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Course Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage published courses, lessons, and student enrollments.</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setShowCreateCourse(true)}>
          <Plus className="h-4 w-4" /> Create Course
        </Button>
      </div>

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreateCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-modal space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Create New Course</h3>
                <button onClick={() => setShowCreateCourse(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Course Title</Label>
                  <Input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required placeholder="e.g. Advanced Business Strategy" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    value={courseDesc}
                    onChange={e => setCourseDesc(e.target.value)}
                    rows={3}
                    placeholder="What will students learn?"
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price (USD) — enter 0 for free</Label>
                  <Input type="number" step="0.01" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} required placeholder="149.00" className="rounded-xl" />
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
                  <Button type="submit" disabled={creatingCourse} className="gap-2">
                    {creatingCourse ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</> : <><Check className="h-3.5 w-3.5" /> Create Course</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No courses yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first course to start selling content.</p>
          <Button onClick={() => setShowCreateCourse(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Course
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => {
            const isExpanded = expandedId === course.id
            const enrolledCount = (course.enrollments || []).length
            const lessonCount = (course.lessons || []).length
            return (
              <div key={course.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                {/* Course header */}
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{course.title}</h3>
                      <Badge className={course.is_active ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                        {course.is_active ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{course.description || "No description"}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">${(course.price_cents / 100).toFixed(0)}</span>
                      <span>{lessonCount} lessons</span>
                      <span>{enrolledCount} enrolled</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl"
                      onClick={() => handleTogglePublish(course)}
                    >
                      {course.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {course.is_active ? "Unpublish" : "Publish"}
                    </Button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : course.id)}
                      className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: Lessons */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground text-sm">Lessons ({lessonCount})</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-xl"
                            onClick={() => setShowAddLesson(showAddLesson === course.id ? null : course.id)}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Lesson
                          </Button>
                        </div>

                        {/* Add Lesson form */}
                        <AnimatePresence>
                          {showAddLesson === course.id && (
                            <motion.form
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              onSubmit={e => handleAddLesson(e, course.id)}
                              className="bg-card border border-border rounded-xl p-4 space-y-3"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label>Lesson Title</Label>
                                  <Input
                                    value={lessonTitle}
                                    onChange={e => setLessonTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Introduction to the Course"
                                    className="rounded-xl"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Video URL (optional)</Label>
                                  <Input
                                    value={lessonVideoUrl}
                                    onChange={e => setLessonVideoUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="rounded-xl"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Lesson Notes / Description</Label>
                                <textarea
                                  value={lessonDesc}
                                  onChange={e => setLessonDesc(e.target.value)}
                                  rows={2}
                                  placeholder="What will be covered in this lesson?"
                                  className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddLesson(null)}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={addingLesson} className="gap-1.5 rounded-xl">
                                  {addingLesson ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                  {addingLesson ? "Adding..." : "Add Lesson"}
                                </Button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>

                        {/* Lesson list */}
                        {(course.lessons || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                            No lessons yet. Add your first lesson above.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(course.lessons || []).map((lesson: any, idx: number) => (
                              <div key={lesson.id} className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
                                <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                                  {lesson.video_url && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Video className="h-3 w-3" /> Has video
                                    </p>
                                  )}
                                </div>
                                {lesson.quiz && (
                                  <Badge className="bg-purple-100 text-purple-600 border-0 text-xs">Quiz</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Enrolled students */}
                        {(course.enrollments || []).length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Enrolled Students ({enrolledCount})</h5>
                            <div className="space-y-1.5">
                              {(course.enrollments || []).slice(0, 5).map((e: any) => (
                                <div key={e.id} className="flex items-center justify-between text-xs text-muted-foreground bg-card px-3 py-2 rounded-lg border border-border">
                                  <span>{e.user?.given_name} {e.user?.family_name}</span>
                                  <span className="text-[10px] opacity-60">{e.user?.email}</span>
                                </div>
                              ))}
                              {enrolledCount > 5 && (
                                <p className="text-xs text-muted-foreground text-center">+{enrolledCount - 5} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
