import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Highlighter, 
  Brain, 
  MessageSquare, 
  Zap, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Sparkles,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Document, Highlight } from "../types";
import { generateFlashcards, generateSummary, evaluateRecall, generateDebate, continueDebate, simplifyExplanation } from "../services/gemini";
import ReactMarkdown from "react-markdown";

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'ai' | 'recall' | 'debate'>('content');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect | null }>({ text: "", rect: null });
  
  // AI States
  const [summary, setSummary] = useState<string>("");
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [recallConcept, setRecallConcept] = useState("");
  const [recallExplanation, setRecallExplanation] = useState("");
  const [recallResult, setRecallResult] = useState<any>(null);
  const [debate, setDebate] = useState<any>(null);
  const [userArgument, setUserArgument] = useState("");
  const [debateHistory, setDebateHistory] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
  const [simplified, setSimplified] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Focus tracking
  const [idleTime, setIdleTime] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showConfusionAlert, setShowConfusionAlert] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/documents/${id}`)
        .then(res => res.json())
        .then(data => {
          setDoc(data);
          setHighlights(data.highlights || []);
        });
    }

    // Focus & Procrastination Monitoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
      }
    };

    const idleInterval = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(idleInterval);
    };
  }, [id]);

  // Separate effect for alerts to avoid resetting interval
  useEffect(() => {
    if (idleTime > 0 && idleTime % 300 === 0) { // Every 5 minutes
       setShowConfusionAlert(true);
    }
  }, [idleTime]);

  // Effect to save session data periodically or on unmount
  useEffect(() => {
    return () => {
      if (id && idleTime > 5) { // Only save if they spent at least 5 seconds
        const sessionData = {
          id: crypto.randomUUID(),
          document_id: id,
          duration: idleTime,
          confusion_alerts: tabSwitches,
          recall_score: recallResult?.score || null
        };
        
        // Use fetch with keepalive for more reliable saving on close
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData),
          keepalive: true
        }).catch(console.error);
      }
    };
  }, [id, idleTime, tabSwitches, recallResult]);

  const getContextForAI = () => {
    if (highlights.length > 0) {
      return highlights.map(h => h.text).join("\n\n");
    }
    return doc?.content || "";
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Ensure the selection is within the content area
        if (contentRef.current?.contains(range.commonAncestorContainer)) {
          setSelection({ text: sel.toString().trim(), rect });
        }
      } catch (e) {
        setSelection({ text: "", rect: null });
      }
    } else {
      setSelection({ text: "", rect: null });
    }
  };

  const addHighlight = async (color: string) => {
    if (!selection.text || !id) return;

    const newHighlight = {
      id: crypto.randomUUID(),
      document_id: id,
      text: selection.text,
      color,
      tags: "",
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHighlight)
      });
      
      if (res.ok) {
        setHighlights(prev => [...prev, newHighlight]);
        setSelection({ text: "", rect: null });
        window.getSelection()?.removeAllRanges();
      }
    } catch (err) {
      console.error("Failed to save highlight", err);
    }
  };

  const HighlightedText = ({ children }: { children: any }) => {
    if (typeof children !== 'string' || !highlights.length) return children;

    const pattern = highlights
      .map(h => h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(p => p.length > 0)
      .join('|');
    
    if (!pattern) return children;

    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = children.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          const highlight = highlights.find(h => h.text.toLowerCase() === part.toLowerCase());
          return highlight ? (
            <mark key={i} className={`${highlight.color} rounded-sm px-0.5 transition-colors`}>
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  };

  const runAIAction = async (action: 'summary' | 'flashcards' | 'simplify' | 'debate') => {
    if (!doc || !doc.content) return;
    setIsGenerating(true);
    try {
      const context = getContextForAI();
      if (action === 'summary') setSummary(await generateSummary(context) || "");
      if (action === 'flashcards') setFlashcards(await generateFlashcards(context));
      if (action === 'simplify') {
        const textToSimplify = selection.text || context;
        setSimplified(await simplifyExplanation(textToSimplify) || "");
      }
      if (action === 'debate') {
        const res = await generateDebate(context);
        setDebate(res);
        setDebateHistory([{ role: 'ai', text: res.challenge }]);
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI Action Failed: ${err.message || "Unknown error"}. Check your API key and connection.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDebateSubmit = async () => {
    if (!userArgument || !debate) return;
    setIsGenerating(true);
    try {
      const res = await continueDebate(debate.challenge, userArgument);
      setDebateHistory(prev => [
        ...prev, 
        { role: 'user', text: userArgument },
        { role: 'ai', text: `${res.evaluation}\n\n${res.rebuttal}` }
      ]);
      setUserArgument("");
    } catch (err: any) {
      console.error(err);
      alert(`Debate Failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecallSubmit = async () => {
    if (!recallConcept || !recallExplanation) return;
    setIsGenerating(true);
    try {
      const result = await evaluateRecall(recallConcept, recallExplanation);
      setRecallResult(result);
    } catch (err: any) {
      console.error(err);
      alert(`Recall Evaluation Failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!doc) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">{doc.title}</h2>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(idleTime / 60)}m studied</span>
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {tabSwitches} distractions</span>
            </div>
          </div>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Reader
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            AI Tools
          </button>
          <button 
            onClick={() => setActiveTab('recall')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'recall' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Recall
          </button>
          <button 
            onClick={() => setActiveTab('debate')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'debate' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Debate
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Content Area */}
        <div 
          ref={contentRef}
          className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-auto relative p-12 leading-relaxed text-lg" 
          onMouseUp={handleTextSelection}
        >
          <div className="max-w-3xl mx-auto prose prose-lg">
            {!doc.content ? (
              <div className="text-center py-20 text-zinc-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No content available.</p>
                <p className="text-sm mt-2">This document appears to be empty or failed to process.</p>
              </div>
            ) : doc.content.startsWith('data:') ? (
              <div className="text-center py-20 text-zinc-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Binary content detected.</p>
                <p className="text-sm mt-2">This material was not correctly processed during upload.</p>
              </div>
            ) : (
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <p><HighlightedText>{children}</HighlightedText></p>,
                  li: ({ children }) => <li><HighlightedText>{children}</HighlightedText></li>,
                  h1: ({ children }) => <h1><HighlightedText>{children}</HighlightedText></h1>,
                  h2: ({ children }) => <h2><HighlightedText>{children}</HighlightedText></h2>,
                  h3: ({ children }) => <h3><HighlightedText>{children}</HighlightedText></h3>,
                  span: ({ children }) => <span><HighlightedText>{children}</HighlightedText></span>,
                }}
              >
                {doc.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Selection Popover */}
          <AnimatePresence>
            {selection.rect && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onMouseUp={(e) => e.stopPropagation()}
                className="fixed bg-zinc-900 text-white p-2 rounded-xl shadow-2xl flex items-center gap-2 z-50"
                style={{ 
                  top: selection.rect.top - 60, 
                  left: selection.rect.left + (selection.rect.width / 2) - 100 
                }}
              >
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addHighlight('bg-yellow-200')} 
                  className="w-8 h-8 rounded-lg bg-yellow-400 hover:scale-110 transition-transform" 
                />
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addHighlight('bg-green-200')} 
                  className="w-8 h-8 rounded-lg bg-green-400 hover:scale-110 transition-transform" 
                />
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addHighlight('bg-blue-200')} 
                  className="w-8 h-8 rounded-lg bg-blue-400 hover:scale-110 transition-transform" 
                />
                <div className="w-px h-6 bg-zinc-700 mx-1" />
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runAIAction('simplify')} 
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-800 rounded-lg text-xs font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Simplify
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Panel */}
        <aside className="w-96 flex flex-col gap-6 overflow-auto">
          {activeTab === 'content' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Highlighter className="w-5 h-5 text-amber-500" />
                  Highlights ({highlights.length})
                </h3>
                <div className="space-y-3">
                  {[...highlights].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(h => (
                    <div key={h.id} className={`p-3 rounded-xl text-sm border border-zinc-100 ${h.color}`}>
                      "{h.text}"
                    </div>
                  ))}
                  {highlights.length === 0 && <p className="text-zinc-400 text-sm italic">No highlights yet. Select text to save key concepts.</p>}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5" />
                  AI Study Assistant
                </h3>
                <p className="text-emerald-100 text-sm">Generate summaries and flashcards to accelerate your learning.</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => runAIAction('summary')}
                    disabled={isGenerating}
                    className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-center transition-colors disabled:opacity-50"
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">Summary</span>
                  </button>
                  <button 
                    onClick={() => runAIAction('flashcards')}
                    disabled={isGenerating}
                    className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-center transition-colors disabled:opacity-50"
                  >
                    <Brain className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">Flashcards</span>
                  </button>
                </div>
              </div>

              {summary && (
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                  <h4 className="font-bold mb-3">Key Summary</h4>
                  <div className="prose prose-sm text-zinc-600">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </div>
              )}

              {flashcards.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold px-2">Flashcards</h4>
                  {flashcards.map((card, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm group cursor-pointer hover:border-emerald-500 transition-colors">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Question</p>
                      <p className="text-sm font-medium text-zinc-900">{card.question}</p>
                      <div className="mt-3 pt-3 border-t border-zinc-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Answer</p>
                        <p className="text-sm text-zinc-600">{card.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recall' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Active Recall
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Concept to Explain</label>
                    <input 
                      value={recallConcept}
                      onChange={e => setRecallConcept(e.target.value)}
                      placeholder="e.g. Photosynthesis"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Your Explanation</label>
                    <textarea 
                      value={recallExplanation}
                      onChange={e => setRecallExplanation(e.target.value)}
                      rows={5}
                      placeholder="Explain it in your own words..."
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>
                  <button 
                    onClick={handleRecallSubmit}
                    disabled={isGenerating || !recallConcept || !recallExplanation}
                    className="w-full bg-purple-600 text-white py-2 rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Evaluate Understanding
                  </button>
                </div>
              </div>

              {recallResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">Evaluation</h4>
                    <span className={`text-2xl font-black ${recallResult.score > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {recallResult.score}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Missing Points</p>
                    <ul className="space-y-1">
                      {recallResult.missingPoints.map((p: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Feedback</p>
                    <p className="text-sm text-zinc-600 italic">"{recallResult.feedback}"</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'debate' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Critical Thinking Debate
                </h3>
                {!debate ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-500 text-sm mb-4">Challenge your understanding with AI-generated counter-arguments based on your highlights.</p>
                    <button 
                      onClick={() => runAIAction('debate')}
                      disabled={isGenerating}
                      className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Start Debate
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-[400px] overflow-y-auto space-y-4 mb-4 pr-2">
                      {debateHistory.map((msg, i) => (
                        <div key={i} className={`p-4 rounded-xl text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-blue-50 border border-blue-100 text-zinc-800' : 'bg-zinc-100 text-zinc-600 ml-8'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50">
                            {msg.role === 'ai' ? 'Hibiscus' : 'You'}
                          </p>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <textarea 
                        value={userArgument}
                        onChange={e => setUserArgument(e.target.value)}
                        placeholder="Your response..."
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows={3}
                      />
                      <button 
                        onClick={handleDebateSubmit}
                        disabled={isGenerating || !userArgument}
                        className="w-full bg-zinc-900 text-white py-2 rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {isGenerating ? "Analyzing..." : "Submit Argument"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Confusion Alert Modal */}
      <AnimatePresence>
        {showConfusionAlert && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Feeling Stuck?</h3>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                You've been on this section for a while. Would you like a simplified explanation of the current topic?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfusionAlert(false)}
                  className="flex-1 px-4 py-3 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  I'm Good
                </button>
                <button 
                  onClick={() => {
                    setShowConfusionAlert(false);
                    setActiveTab('ai');
                    runAIAction('simplify');
                  }}
                  className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  Yes, Simplify!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simplified Content Modal */}
      <AnimatePresence>
        {simplified && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Simplified Explanation
                </h3>
                <button onClick={() => setSimplified("")} className="text-emerald-200 hover:text-white text-2xl">×</button>
              </div>
              <div className="p-8 prose prose-emerald max-w-none">
                <ReactMarkdown>{simplified}</ReactMarkdown>
              </div>
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={() => setSimplified("")}
                  className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
