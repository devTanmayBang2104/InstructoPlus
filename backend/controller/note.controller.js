import Note from "../model/note.model.js";
import Course from "../model/course.Model.js";
import Lecture from "../model/lecture.Model.js";

/**
 * Create a new personal note / bookmark for a lecture
 */
export const createNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId, lectureId, timestamp = 0, content, tags = [] } = req.body;

    if (!courseId || !lectureId) {
      return res.status(400).json({
        success: false,
        message: "courseId and lectureId are required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot be empty",
      });
    }

    // Verify course & lecture exist
    const [course, lecture] = await Promise.all([
      Course.findById(courseId).select("title"),
      Lecture.findById(lectureId).select("lectureTitle courseId"),
    ]);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const note = await Note.create({
      userId,
      courseId,
      lectureId,
      timestamp: Math.max(0, Math.floor(Number(timestamp) || 0)),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    });

    const populatedNote = await Note.findById(note._id)
      .populate("lectureId", "lectureTitle duration isYoutubeVideo")
      .populate("courseId", "title");

    return res.status(201).json({
      success: true,
      message: "Note saved successfully",
      note: populatedNote,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create note",
      error: error.message,
    });
  }
};

/**
 * Get all notes for a specific course (current user)
 */
export const getCourseNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    const notes = await Note.find({ userId, courseId })
      .populate("lectureId", "lectureTitle duration isYoutubeVideo")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Error fetching course notes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
      error: error.message,
    });
  }
};

/**
 * Get notes for a specific lecture (current user)
 */
export const getLectureNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const { lectureId } = req.params;

    const notes = await Note.find({ userId, lectureId })
      .populate("lectureId", "lectureTitle duration")
      .sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Error fetching lecture notes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lecture notes",
      error: error.message,
    });
  }
};

/**
 * Update an existing note
 */
export const updateNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;
    const { content, timestamp, tags } = req.body;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    if (note.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this note",
      });
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ success: false, message: "Note content cannot be empty" });
      }
      note.content = content.trim();
    }

    if (timestamp !== undefined) {
      note.timestamp = Math.max(0, Math.floor(Number(timestamp) || 0));
    }

    if (tags !== undefined && Array.isArray(tags)) {
      note.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    }

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate("lectureId", "lectureTitle duration")
      .populate("courseId", "title");

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update note",
      error: error.message,
    });
  }
};

/**
 * Delete a note
 */
export const deleteNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    if (note.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this note",
      });
    }

    await Note.findByIdAndDelete(noteId);

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
      noteId,
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete note",
      error: error.message,
    });
  }
};

/**
 * Export all notes for a course as formatted Markdown
 */
export const exportCourseNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    const [course, notes] = await Promise.all([
      Course.findById(courseId).select("title category level"),
      Note.find({ userId, courseId })
        .populate("lectureId", "lectureTitle")
        .sort({ lectureId: 1, timestamp: 1 }),
    ]);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Helper to format seconds as MM:SS or HH:MM:SS
    const formatTimestamp = (sec = 0) => {
      const s = Math.floor(sec);
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      if (hrs > 0) {
        return `${hrs}:${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
      }
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // Build Markdown string
    let markdown = `# Notes: ${course.title}\n\n`;
    markdown += `* **Course Level:** ${course.level || "N/A"}\n`;
    markdown += `* **Category:** ${course.category || "N/A"}\n`;
    markdown += `* **Exported Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`;
    markdown += `* **Total Notes:** ${notes.length}\n\n`;
    markdown += `---\n\n`;

    if (notes.length === 0) {
      markdown += `*No notes recorded yet for this course.*\n`;
    } else {
      // Group by lecture
      const groupedByLecture = {};
      notes.forEach((note) => {
        const lectureTitle = note.lectureId?.lectureTitle || "General Notes";
        if (!groupedByLecture[lectureTitle]) {
          groupedByLecture[lectureTitle] = [];
        }
        groupedByLecture[lectureTitle].push(note);
      });

      for (const [lectureTitle, lectureNotes] of Object.entries(groupedByLecture)) {
        markdown += `## 📚 ${lectureTitle}\n\n`;
        lectureNotes.forEach((n, idx) => {
          const time = formatTimestamp(n.timestamp);
          const date = new Date(n.createdAt).toLocaleDateString();
          markdown += `### ${idx + 1}. [⏱ ${time}] - ${date}\n\n`;
          markdown += `${n.content}\n\n`;
          if (n.tags && n.tags.length > 0) {
            markdown += `> **Tags:** ${n.tags.map((t) => `\`#${t}\``).join(" ")}\n\n`;
          }
        });
        markdown += `---\n\n`;
      }
    }

    return res.status(200).json({
      success: true,
      courseTitle: course.title,
      totalNotes: notes.length,
      markdown,
      notes,
    });
  } catch (error) {
    console.error("Error exporting notes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export notes",
      error: error.message,
    });
  }
};
