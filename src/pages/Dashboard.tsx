import { useState, useEffect } from "react";
import { Plus, Folder, Brain, Highlighter, Zap, ChevronRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Lesson, StudyStats } from "../types";

export default function Dashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<StudyStats>({ 
    totalDocs: 0, 
    totalHighlights: 0, 
    avgRecall: 0,
    totalTime: 0,
    totalDistractions: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: "", description: "" });

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lessonsRes, statsRes] = await Promise.all([
        fetch("/api/lessons"),
        fetch("/api/stats")
      ]);
      setLessons(await lessonsRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.title) return;

    const lesson = {
      id: crypto.randomUUID(),
      ...newLesson
    };

    await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lesson)
    });

    setLessons([lesson as Lesson, ...lessons]);
    setIsModalOpen(false);
    setNewLesson({ title: "", description: "" });
  };

  const handleDeleteLesson = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this lesson and all its materials? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLessons(prev => prev.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete lesson", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Workspaces</h2>
          <p className="text-zinc-500 mt-1">Organize your study materials into lessons.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all disabled:opacity-50"
            title="Refresh dashboard"
          >
            <Zap className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Lesson
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Materials</p>
          <p className="text-2xl font-black text-zinc-900">{stats.totalDocs}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Highlights</p>
          <p className="text-2xl font-black text-amber-600">{stats.totalHighlights}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Recall Avg</p>
          <p className="text-2xl font-black text-emerald-600">{Math.round(stats.avgRecall)}%</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Study Time</p>
          <p className="text-2xl font-black text-blue-600">{Math.round(stats.totalTime / 60)}m</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Focus Score</p>
          <p className="text-2xl font-black text-purple-600">
            {stats.totalTime > 0 ? Math.max(0, Math.round(100 - (stats.totalDistractions / (stats.totalTime / 60)) * 10)) : 100}%
          </p>
        </div>
      </div>

      {/* Lessons Grid */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Active Lessons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-zinc-50 border border-zinc-100 rounded-2xl animate-pulse" />
            ))
          ) : (
            <>
              {lessons.map((lesson) => (
                <Link 
                  key={lesson.id} 
                  to={`/lesson/${lesson.id}`}
                  className="group bg-white p-6 rounded-2xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDeleteLesson(e, lesson.id)}
                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-zinc-900 mb-2">{lesson.title}</h4>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{lesson.description || "No description provided."}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                    <span className="text-xs text-zinc-400">Created {new Date(lesson.created_at).toLocaleDateString()}</span>
                    <Zap className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              {lessons.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
                  <Folder className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-400 font-medium">No lessons yet. Create your first workspace to get started.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 text-emerald-600 font-bold hover:underline"
                  >
                    Create Lesson
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Create Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="text-lg font-bold">New Study Workspace</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateLesson} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Lesson Title</label>
                <input 
                  required
                  value={newLesson.title}
                  onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                  placeholder="e.g. Quantum Physics 101" 
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Description (Optional)</label>
                <textarea 
                  value={newLesson.description}
                  onChange={e => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="What are you studying in this lesson?" 
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" 
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Create Workspace
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
