// frontend/SharedRepoo/assets/js/Dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  // Simple guard: if not logged in (frontend flag), go back to login
  if (!localStorage.getItem("noteai_logged_in")) {
    // optional: you can comment this out if you don't want a guard
    // window.location.href = "LoginPage.html";
  }
  document.addEventListener("click", () => {
  document.querySelectorAll(".menu-dropdown").forEach((dd) => {
    dd.style.display = "none";
  });
});

const API_BASE = "http://127.0.0.1:8000";

async function apiArchiveNoteRaw(id) {
  const res = await fetch(
    `${API_BASE}/notes/${encodeURIComponent(id)}/archive`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    throw new Error((data && data.detail) || res.statusText || "Request failed");
  }
  return data;
}

async function apiTrashNoteRaw(id) {
  const res = await fetch(
    `${API_BASE}/notes/${encodeURIComponent(id)}/trash`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    throw new Error((data && data.detail) || res.statusText || "Request failed");
  }
  return data;
}

async function apiAddFavoriteRaw(id) {
  const res = await fetch(
    `${API_BASE}/notes/${encodeURIComponent(id)}/favorite`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok && res.status !== 204) {
    throw new Error((data && data.detail) || res.statusText || "Request failed");
  }
  return data;
}


  // DOM elements
  const notesListEl = document.getElementById("notes-list");

  const createForm = document.getElementById("create-note-form");
  const newTitleInput = document.getElementById("new-note-title");
  const newBodyInput = document.getElementById("new-note-body");

  const noteTitleInput = document.getElementById("note-title");
  const noteBodyInput = document.getElementById("note-body");
  const notePinnedCheckbox = document.getElementById("note-pinned");
  const noteStatusSelect = document.getElementById("note-status");

  const saveNoteBtn = document.getElementById("save-note-btn");
  const deleteNoteBtn = document.getElementById("delete-note-btn");

  const summarizeBtn = document.getElementById("summarize-btn");
  const summaryOutput = document.getElementById("summary-output");

  const questionInput = document.getElementById("question-input");
  const askBtn = document.getElementById("ask-btn");
  const answerOutput = document.getElementById("answer-output");

  const filterAllBtn = document.getElementById("filter-all");
  const filterPinnedBtn = document.getElementById("filter-pinned");
  const filterArchivedBtn = document.getElementById("filter-archived");
  const filterTrashedBtn = document.getElementById("filter-trashed");

  const logoutBtn = document.getElementById("logout-btn");

  // State
  let allNotes = [];
  let currentNoteId = null;
  let currentFilter = "ALL"; // ALL | PINNED | ARCHIVED | TRASHED

  // 0) Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await window.NoteAI.logout();
      } catch (err) {
        console.error("Logout error (ignored):", err);
      } finally {
        window.location.href = "LoginPage.html";
      }
    });
  }

  // 1) Load notes
async function loadNotes() {
  try {
    const raw = await window.NoteAI.listNotes();
    console.log("Raw /notes response:", raw);

    // Handle different possible shapes:
    // 1) Array of notes: [ {...}, {...} ]
    // 2) Wrapped: { items: [ {...}, {...} ] }
    // 3) Single note object: { id: ..., title: ... }

    if (Array.isArray(raw)) {
      allNotes = raw;
    } else if (raw && Array.isArray(raw.items)) {
      allNotes = raw.items;
    } else if (raw && typeof raw === "object" && raw.id) {
      allNotes = [raw];
    } else {
      allNotes = [];
    }

    renderNotesList();
  } catch (err) {
    console.error(err);
    alert("Failed to load notes: " + err.message);
  }
}

  // 2) Filter and render list
  function getFilteredNotes() {
    if (currentFilter === "PINNED") {
      return allNotes.filter((n) => n.is_pinned);
    }
    if (currentFilter === "ARCHIVED") {
      return allNotes.filter((n) => n.status === "ARCHIVED");
    }
    if (currentFilter === "TRASHED") {
      return allNotes.filter((n) => n.status === "TRASHED");
    }
    return allNotes;
  }

function renderNotesList() {
  if (!notesListEl) return;

  notesListEl.innerHTML = "";

  const notesToShow = getFilteredNotes();

  if (notesToShow.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No notes.";
    notesListEl.appendChild(p);
    return;
  }

  notesToShow.forEach((note) => {
    const title = note.title || "(untitled)";
    const body = note.body || "";

    const snippet =
      body.length > 160 ? body.slice(0, 160).replace(/\s+\S*$/, "") + "…" : body;

    const article = document.createElement("article");
    article.className = "note-row";

    article.innerHTML = `
      <div class="note-meta">
        <div class="note-title">${escapeHtml(title)}</div>
        <div class="note-sub">
          ${escapeHtml(snippet)}
        </div>
      </div>
      <div class="menu-wrapper">
        <button class="menu-btn" aria-label="More options">⋮</button>
        <div class="menu-dropdown">
          <button type="button" data-action="archive">Archive</button>
          <button type="button" data-action="delete">Delete</button>
          <button type="button" data-action="pin">Pin</button>
        </div>
      </div>
    `;

    // Select note into editor when clicking the left area
    const meta = article.querySelector(".note-meta");
    meta.addEventListener("click", () => {
      selectNote(note);
    });

    // Dropdown handling
    const dropdown = article.querySelector(".menu-dropdown");
    const menuBtn = article.querySelector(".menu-btn");
    dropdown.style.display = "none";

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Close all other dropdowns
      document.querySelectorAll(".menu-dropdown").forEach((dd) => {
        if (dd !== dropdown) dd.style.display = "none";
      });

      // Toggle this one
      dropdown.style.display =
        dropdown.style.display === "none" || dropdown.style.display === ""
          ? "block"
          : "none";
    });

    // Archive / Delete / Pin
    const archiveBtn = dropdown.querySelector('[data-action="archive"]');
    const deleteBtn = dropdown.querySelector('[data-action="delete"]');
    const pinBtn = dropdown.querySelector('[data-action="pin"]');

    archiveBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  dropdown.style.display = "none";
  try {
    await apiArchiveNoteRaw(note.id);   // POST /notes/{id}/archive
    await loadNotes();
  } catch (err) {
    console.error(err);
    alert("Failed to archive note: " + err.message);
  }
});

// soft delete → move to trash
deleteBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  dropdown.style.display = "none";
  if (!confirm("Move this note to Trash?")) return;
  try {
    await apiTrashNoteRaw(note.id);     // POST /notes/{id}/trash
    await loadNotes();
  } catch (err) {
    console.error(err);
    alert("Failed to delete note: " + err.message);
  }
});

// pin (favorite). For now, just add favorite; unpin can be handled later.
pinBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  dropdown.style.display = "none";
  try {
    await apiAddFavoriteRaw(note.id);   // POST /notes/{id}/favorite
    alert("Note pinned (added to favorites).");
  } catch (err) {
    console.error(err);
    alert("Failed to pin note: " + err.message);
  }
});


    notesListEl.appendChild(article);
  });
}

// Helper for safe HTML injection
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



  // 3) Select a note into editor
  function selectNote(note) {
    currentNoteId = note.id;
    noteTitleInput.value = note.title || "";
    noteBodyInput.value = note.body || "";
    notePinnedCheckbox.checked = !!note.is_pinned;
    noteStatusSelect.value = note.status || "";

    summaryOutput.value = "";
    answerOutput.value = "";
  }

  // 4) Create note
  if (createForm) {
    createForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const newNote = await window.NoteAI.createNote({
          title: newTitleInput.value,
          body: newBodyInput.value,
        });

        allNotes.push(newNote);
        renderNotesList();

        newTitleInput.value = "";
        newBodyInput.value = "";
      } catch (err) {
        console.error(err);
        alert("Failed to create note: " + err.message);
      }
    });
  }

  // 5) Save/update note
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", async () => {
      if (!currentNoteId) {
        alert("Select a note first.");
        return;
      }
      try {
        const patch = {
          title: noteTitleInput.value,
          body: noteBodyInput.value,
          is_pinned: notePinnedCheckbox.checked,
        };

        const status = noteStatusSelect.value;
        patch.status = status || "ACTIVE";

        const updated = await window.NoteAI.updateNote(currentNoteId, patch);

        const idx = allNotes.findIndex((n) => n.id === currentNoteId);
        if (idx !== -1) {
          allNotes[idx] = updated;
        }

        renderNotesList();
        alert("Note saved.");
      } catch (err) {
        console.error(err);
        alert("Failed to save note: " + err.message);
      }
    });
  }

  // 6) Delete note
  if (deleteNoteBtn) {
    deleteNoteBtn.addEventListener("click", async () => {
      if (!currentNoteId) {
        alert("Select a note first.");
        return;
      }
      if (!confirm("Delete this note?")) return;

      try {
        await window.NoteAI.deleteNote(currentNoteId);

        allNotes = allNotes.filter((n) => n.id !== currentNoteId);
        currentNoteId = null;

        noteTitleInput.value = "";
        noteBodyInput.value = "";
        notePinnedCheckbox.checked = false;
        noteStatusSelect.value = "";
        summaryOutput.value = "";
        answerOutput.value = "";

        renderNotesList();
      } catch (err) {
        console.error(err);
        alert("Failed to delete note: " + err.message);
      }
    });
  }

  // 7) Summarize note – with loading state
  if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async () => {
      if (!currentNoteId) {
        alert("Select a note first.");
        return;
      }

      const originalText = summarizeBtn.textContent;
      summarizeBtn.disabled = true;
      summarizeBtn.textContent = "Summarizing...";

      try {
        const text = noteBodyInput.value;

        const res = await window.NoteAI.summarizeNote({
          note_id: currentNoteId,
          text,
          language: "en",
          max_sentences: 5,
        });

        const { summary, key_points, citations } = res || {};

        let output = "";

        if (Array.isArray(summary) && summary.length > 0) {
          output += "Summary:\n\n" + summary.join("\n\n") + "\n";
        }

        if (Array.isArray(key_points) && key_points.length > 0) {
          output += "\nKey points:\n";
          key_points.forEach((kp) => {
            output += "- " + kp + "\n";
          });
        }

        if (Array.isArray(citations) && citations.length > 0) {
          output += "\nCitations:\n";
          citations.forEach((c) => {
            const q = c.quote || "";
            const why = c.why || "";
            if (q || why) {
              output += `- "${q}" — ${why}\n`;
            }
          });
        }

        if (!output) {
          output = "No summary returned.";
        }

        summaryOutput.value = output;
      } catch (err) {
        console.error(err);
        alert("Failed to summarize: " + err.message);
      } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = originalText;
      }
    });
  }

  // 8) QA
  if (askBtn) {
    askBtn.addEventListener("click", async () => {
      if (!currentNoteId) {
        alert("Select a note first.");
        return;
      }

      const question = questionInput.value.trim();
      if (!question) {
        alert("Type a question first.");
        return;
      }

      const originalText = askBtn.textContent;
      askBtn.disabled = true;
      askBtn.textContent = "Thinking...";

      try {
        const res = await window.NoteAI.askNoteQuestion({
          note_id: currentNoteId,
          question,
          language: "en",
        });

        const { answer, citations } = res || {};
        let output = "";

        if (answer) {
          output += "Answer:\n\n" + answer + "\n";
        }

        if (Array.isArray(citations) && citations.length > 0) {
          output += "\nCitations:\n";
          citations.forEach((c) => {
            const q = c.quote || "";
            const why = c.why || "";
            if (q || why) {
              output += `- "${q}" — ${why}\n`;
            }
          });
        }

        if (!output) {
          output = "No answer returned.";
        }

        answerOutput.value = output;
      } catch (err) {
        console.error(err);
        alert("Failed to answer question: " + err.message);
      } finally {
        askBtn.disabled = false;
        askBtn.textContent = originalText;
      }
    });
  }

  // 9) Filters
  if (filterAllBtn) {
    filterAllBtn.addEventListener("click", () => {
      currentFilter = "ALL";
      renderNotesList();
    });
  }

  if (filterPinnedBtn) {
    filterPinnedBtn.addEventListener("click", () => {
      currentFilter = "PINNED";
      renderNotesList();
    });
  }

  if (filterArchivedBtn) {
    filterArchivedBtn.addEventListener("click", () => {
      currentFilter = "ARCHIVED";
      renderNotesList();
    });
  }

  if (filterTrashedBtn) {
    filterTrashedBtn.addEventListener("click", () => {
      currentFilter = "TRASHED";
      renderNotesList();
    });
  }

  // Initial load
  loadNotes();
});
