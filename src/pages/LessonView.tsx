import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Globe, ChevronLeft, Zap, Trash2, ExternalLink, BookOpen, Highlighter } from "lucide-react";
import type { Document, Lesson, Highlight } from "../types";
import * as pdfjsLib from "pdfjs-dist";

interface LessonHighlight extends Highlight {
  document_title: string;
}

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'notes'>('materials');
  const [lessonHighlights, setLessonHighlights] = useState<LessonHighlight[]>([]);

  useEffect(() => {
    if (lessonId) {
      fetch(`/api/lessons/${lessonId}/documents`)
        .then(res => res.json())
        .then(setDocuments);
      
      fetch(`/api/lessons/${lessonId}/highlights`)
        .then(res => res.json())
        .then(setLessonHighlights);
    }
  }, [lessonId]);

  const handleDeleteDocument = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this document and its highlights?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        setLessonHighlights(prev => prev.filter(h => h.document_id !== id));
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }
      return fullText.trim();
    } catch (err) {
      console.error("PDF.js error:", err);
      throw new Error("Failed to extract text from PDF. The file might be encrypted or corrupted.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lessonId) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        let content = "";
        const isPdf = file.type === 'application/pdf';
        
        if (isPdf) {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          content = await extractTextFromPdf(arrayBuffer);
        } else {
          content = event.target?.result as string;
        }

        if (!content || content.trim().length === 0) {
          alert("No text could be extracted from this file.");
          setIsUploading(false);
          return;
        }

        // Structure the text using Gemini
        try {
          const { structureText } = await import("../services/gemini");
          content = await structureText(content) || content;
        } catch (err) {
          console.warn("Failed to structure text, using raw content:", err);
        }

        const newDoc = {
          id: crypto.randomUUID(),
          lesson_id: lessonId,
          title: file.name,
          content: content,
          type: isPdf ? 'pdf' : 'text'
        };

        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newDoc)
        });

        setDocuments(prev => [...prev, newDoc as Document]);
        setIsUploadModalOpen(false);
      } catch (err: any) {
        alert(err.message || "An error occurred during upload.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      alert("Failed to read file.");
      setIsUploading(false);
    };
    
    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleUrlFetch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = (e.target as any).url.value;
    if (!url || !lessonId) return;

    setIsFetching(true);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      const newDoc = {
        id: crypto.randomUUID(),
        lesson_id: lessonId,
        title: data.title,
        content: data.content || "No content extracted.",
        type: 'url'
      };

      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc)
      });

      setDocuments([...documents, newDoc as Document]);
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lesson Workspace</h2>
            <p className="text-zinc-500 text-sm">Manage all materials for this topic.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button 
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'materials' ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Materials ({documents.length})
          </div>
          {activeTab === 'materials' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${activeTab === 'notes' ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
        >
          <div className="flex items-center gap-2">
            <Highlighter className="w-4 h-4" />
            Master Note ({lessonHighlights.length})
          </div>
          {activeTab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
        </button>
      </div>

      {activeTab === 'materials' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Link 
              key={doc.id} 
              to={`/reader/${doc.id}`}
              className="group bg-white p-5 rounded-2xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  {doc.type === 'pdf' ? <FileText className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Zap className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
              <h4 className="font-bold text-zinc-900 line-clamp-1">{doc.title}</h4>
              <p className="text-xs text-zinc-400 mt-1 uppercase font-bold tracking-wider">{doc.type}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                <span>Added {new Date(doc.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ChevronLeft className="w-3 h-3 rotate-180" />
                </span>
              </div>
            </Link>
          ))}
          {documents.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
              <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">No materials in this lesson yet.</p>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 text-emerald-600 font-bold hover:underline"
              >
                Add your first PDF or URL
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Highlighter className="w-6 h-6 text-amber-500" />
              Master Study Note
            </h3>
            <button 
              onClick={async () => {
                const allText = lessonHighlights.map(h => h.text).join("\n\n");
                const { generateSummary } = await import("../services/gemini");
                const summary = await generateSummary(allText);
                alert("Lesson Summary:\n\n" + summary);
              }}
              disabled={lessonHighlights.length === 0}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Summarize All Highlights
            </button>
          </div>

          {lessonHighlights.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-zinc-200">
              <Highlighter className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">No highlights across this lesson yet.</p>
              <p className="text-sm text-zinc-400 mt-1">Open a document and start highlighting to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {Array.from(new Set(lessonHighlights.map(h => h.document_title))).map(docTitle => (
                <div key={docTitle} className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                  <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      {docTitle}
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {lessonHighlights.filter(h => h.document_title === docTitle).length} Highlights
                    </span>
                  </div>
                  <div className="p-6 space-y-6">
                    {lessonHighlights.filter(h => h.document_title === docTitle).map(h => (
                      <div key={h.id} className="relative pl-6 group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${h.color || 'bg-yellow-200'}`} />
                        <p className="text-zinc-800 leading-relaxed italic">"{h.text}"</p>
                        {h.tags && (
                          <div className="mt-2 flex gap-2">
                            {h.tags.split(',').map(tag => (
                              <span key={tag} className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h3 className="text-lg font-bold">Add New Material</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-2xl">×</button>
            </div>
            <div className="p-8 space-y-6">
              <label className={`block p-10 border-2 border-dashed border-zinc-200 rounded-2xl transition-all text-center group ${isUploading ? 'opacity-50 cursor-wait' : 'hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'}`}>
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} disabled={isUploading} />
                <FileText className={`w-12 h-12 mx-auto mb-3 transition-colors ${isUploading ? 'text-zinc-200' : 'text-zinc-300 group-hover:text-emerald-500'}`} />
                <p className="text-sm font-bold text-zinc-600">{isUploading ? "Processing PDF..." : "Upload PDF or Text"}</p>
                <p className="text-xs text-zinc-400 mt-1">{isUploading ? "This may take a few seconds" : "Drag and drop or click to browse"}</p>
              </label>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-zinc-400 font-bold tracking-widest">Or</span></div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-700">Import from Web URL</label>
                <form onSubmit={handleUrlFetch} className="flex gap-2">
                  <input 
                    name="url" 
                    type="url" 
                    required
                    placeholder="https://example.com/article" 
                    className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  />
                  <button 
                    type="submit" 
                    disabled={isFetching}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all"
                  >
                    {isFetching ? "..." : "Fetch"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
