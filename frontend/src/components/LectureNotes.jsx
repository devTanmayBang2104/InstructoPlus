import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import {
  FaBookmark,
  FaStickyNote,
  FaEdit,
  FaTrash,
  FaDownload,
  FaFilePdf,
  FaFileCode,
  FaTags,
  FaPlay,
  FaPlus,
  FaCheck,
  FaTimes,
  FaClock,
} from "react-icons/fa";

function LectureNotes({
  courseId,
  selectedLecture,
  currentVideoTime = 0,
  onSeek,
  onSwitchLecture,
  courseTitle = "Course",
}) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterMode, setFilterMode] = useState("lecture"); // 'lecture' | 'all'
  const [noteContent, setNoteContent] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState(0);
  const [selectedTag, setSelectedTag] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const defaultTags = ["Important", "Bookmark", "Revision", "Question"];

  // Helper to format seconds as MM:SS
  const formatTime = (seconds = 0) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sync new note timestamp with current video time when video progresses
  useEffect(() => {
    if (!editingNoteId && currentVideoTime > 0) {
      setNoteTimestamp(Math.floor(currentVideoTime));
    }
  }, [currentVideoTime, editingNoteId]);

  // Fetch all course notes
  const fetchNotes = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/notes/course/${courseId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setNotes(res.data.notes || []);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [courseId]);

  // Add new note
  const handleAddNote = async (e) => {
    e?.preventDefault();
    if (!noteContent.trim()) {
      toast.error("Please enter some note content");
      return;
    }
    if (!selectedLecture?._id) {
      toast.error("No lecture selected");
      return;
    }

    try {
      setSaving(true);
      const tags = selectedTag ? [selectedTag] : [];
      const res = await axios.post(
        `${serverUrl}/api/notes`,
        {
          courseId,
          lectureId: selectedLecture._id,
          timestamp: noteTimestamp,
          content: noteContent.trim(),
          tags,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.note) {
        setNotes((prev) => [res.data.note, ...prev]);
        setNoteContent("");
        setSelectedTag("");
        toast.success("Note saved at " + formatTime(noteTimestamp));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }
    try {
      const res = await axios.put(
        `${serverUrl}/api/notes/${noteId}`,
        { content: editContent.trim() },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.note) {
        setNotes((prev) =>
          prev.map((n) => (n._id === noteId ? res.data.note : n))
        );
        setEditingNoteId(null);
        setEditContent("");
        toast.success("Note updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update note");
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await axios.delete(`${serverUrl}/api/notes/${noteId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setNotes((prev) => prev.filter((n) => n._id !== noteId));
        toast.success("Note deleted");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete note");
    }
  };

  // Export as Markdown (.md)
  const handleExportMarkdown = async () => {
    try {
      setShowExportMenu(false);
      const res = await axios.get(`${serverUrl}/api/notes/export/${courseId}`, {
        withCredentials: true,
      });

      const markdownContent =
        res.data?.markdown || generateFallbackMarkdown();

      const blob = new Blob([markdownContent], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanTitle = courseTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `${cleanTitle}_Notes.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Markdown notes downloaded! 📝");
    } catch (err) {
      console.error("Export markdown error:", err);
      // Fallback export from local notes
      const fallbackMd = generateFallbackMarkdown();
      const blob = new Blob([fallbackMd], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Notes_${courseTitle}.md`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Markdown exported!");
    }
  };

  // Export as PDF / Printable formatted page
  const handleExportPDF = () => {
    setShowExportMenu(false);
    if (notes.length === 0) {
      toast.info("No notes to export yet!");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    const notesHtml = notes
      .map(
        (n, i) => `
        <div style="margin-bottom: 20px; padding: 12px; border-left: 4px solid #4f46e5; background: #f8fafc; border-radius: 4px;">
          <div style="font-size: 13px; font-weight: 600; color: #4338ca; margin-bottom: 4px;">
            ${n.lectureId?.lectureTitle || "General Lecture"} • ⏱ ${formatTime(n.timestamp)}
          </div>
          <div style="font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">
            ${n.content}
          </div>
          ${
            n.tags && n.tags.length > 0
              ? `<div style="margin-top: 6px; font-size: 11px; color: #64748b;">
                  Tags: ${n.tags.map((t) => `<span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">#${t}</span>`).join("")}
                </div>`
              : ""
          }
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${courseTitle} - Lecture Notes</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e1b4b; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 8px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>📖 ${courseTitle} - Study Notes</h1>
          <div class="meta">Exported on ${new Date().toLocaleDateString()} • Total Notes: ${notes.length}</div>
          <div class="notes-container">${notesHtml}</div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Print dialog opened for PDF export! 📄");
  };

  const generateFallbackMarkdown = () => {
    let md = `# Notes: ${courseTitle}\n\n`;
    md += `* Exported Date: ${new Date().toLocaleDateString()}\n`;
    md += `* Total Notes: ${notes.length}\n\n---\n\n`;
    notes.forEach((n, idx) => {
      const lec = n.lectureId?.lectureTitle || "Lecture";
      md += `### ${idx + 1}. ${lec} [⏱ ${formatTime(n.timestamp)}]\n\n`;
      md += `${n.content}\n\n`;
      if (n.tags?.length) {
        md += `> Tags: ${n.tags.map((t) => `\`#${t}\``).join(" ")}\n\n`;
      }
    });
    return md;
  };

  // Filter notes
  const displayedNotes =
    filterMode === "lecture"
      ? notes.filter(
          (n) => n.lectureId?._id === selectedLecture?._id || n.lectureId === selectedLecture?._id
        )
      : notes;

  return (
    <div
      data-testid="lecture-notes-container"
      className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-5 border border-gray-200 dark:border-slate-800 transition-colors"
    >
      {/* Header & Export Dropdown */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FaStickyNote className="text-indigo-600 dark:text-indigo-400 text-lg" />
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
            Personalized Notes & Bookmarks
          </h2>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            {notes.length}
          </span>
        </div>

        {/* Export Menu */}
        <div className="relative">
          <button
            id="export-notes-btn"
            data-testid="export-notes-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            title="Export Notes"
          >
            <FaDownload className="text-xs" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-1.5 z-20">
              <button
                id="export-markdown-btn"
                data-testid="export-markdown-btn"
                onClick={handleExportMarkdown}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <FaFileCode className="text-indigo-600 dark:text-indigo-400 text-sm" />
                <span>Export as Markdown (.md)</span>
              </button>
              <button
                id="export-pdf-btn"
                data-testid="export-pdf-btn"
                onClick={handleExportPDF}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <FaFilePdf className="text-red-500 text-sm" />
                <span>Export as PDF / Print</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="mt-4 space-y-3">
        {/* Timestamp capture chip */}
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            id="capture-timestamp-btn"
            data-testid="capture-timestamp-btn"
            onClick={() => setNoteTimestamp(Math.floor(currentVideoTime))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition font-medium"
            title="Click to snapshot current playback time"
          >
            <FaClock className="text-xs text-indigo-500" />
            <span>Timestamp: {formatTime(noteTimestamp)}</span>
          </button>

          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Auto-captured from video
          </span>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            id="note-content-input"
            data-testid="note-content-input"
            rows="2"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Type key insight, formula, question, or bookmark..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
          />
        </div>

        {/* Quick Tag Selector & Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <FaTags className="text-gray-400 text-xs" />
            {defaultTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition ${
                  selectedTag === tag
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <button
            type="submit"
            id="save-note-btn"
            data-testid="save-note-btn"
            disabled={saving || !noteContent.trim()}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {saving ? (
              <ClipLoader size={12} color="white" />
            ) : (
              <>
                <FaPlus className="text-xs" />
                <span>Save Note</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Filter Tabs: Lecture vs All */}
      <div className="flex items-center gap-2 mt-5 mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">
        <button
          type="button"
          id="filter-lecture-notes"
          data-testid="filter-lecture-notes"
          onClick={() => setFilterMode("lecture")}
          className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
            filterMode === "lecture"
              ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Current Lecture ({notes.filter((n) => n.lectureId?._id === selectedLecture?._id || n.lectureId === selectedLecture?._id).length})
        </button>
        <button
          type="button"
          id="filter-all-notes"
          data-testid="filter-all-notes"
          onClick={() => setFilterMode("all")}
          className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
            filterMode === "all"
              ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          All Course Notes ({notes.length})
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center py-6">
            <ClipLoader size={20} color="#4f46e5" />
          </div>
        ) : displayedNotes.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
            {filterMode === "lecture"
              ? "No notes for this lecture yet. Add your first note above!"
              : "No notes taken for this course yet."}
          </div>
        ) : (
          displayedNotes.map((note) => {
            const isEditing = editingNoteId === note._id;
            const isDiffLecture =
              note.lectureId?._id &&
              note.lectureId?._id !== selectedLecture?._id;

            return (
              <div
                key={note._id}
                data-testid="note-item"
                className="p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/50 hover:bg-gray-100/70 dark:hover:bg-slate-800 transition"
              >
                {/* Note Header: Timestamp seeking button & Lecture title */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      data-testid="seek-timestamp-btn"
                      onClick={() => {
                        if (isDiffLecture && onSwitchLecture) {
                          onSwitchLecture(note.lectureId);
                        }
                        if (onSeek) onSeek(note.timestamp);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 px-2 py-0.5 rounded transition cursor-pointer"
                      title="Click to jump video to this timestamp"
                    >
                      <FaPlay className="text-[9px]" />
                      <span>{formatTime(note.timestamp)}</span>
                    </button>

                    {filterMode === "all" && note.lectureId?.lectureTitle && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                        {note.lectureId.lectureTitle}
                      </span>
                    )}
                  </div>

                  {/* Edit / Delete action buttons */}
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note._id);
                            setEditContent(note.content);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Edit note"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note._id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                          title="Delete note"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Note Content / Inline Edit */}
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      rows="2"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateNote(note._id)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {note.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-gray-200/80 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default LectureNotes;
