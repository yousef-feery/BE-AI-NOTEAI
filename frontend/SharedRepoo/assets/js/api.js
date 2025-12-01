// frontend/SharedRepoo/assets/js/api.js

const API_BASE = "http://127.0.0.1:8000";

// Generic helper
async function apiRequest(path, { method = "GET", body = null } = {}) {
  const headers = {};

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
    credentials: "include", // send/receive cookies
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore non-json
  }

  if (!res.ok) {
    const msg = (data && data.detail) || res.statusText || "Request failed";
    throw new Error(msg);
  }

  return data;
}

const NoteAI = {
  //
  // AUTH
  //

  // This is your dev endpoint that you already got working.
  // If it's /dev-login or something else, make sure the path matches here.
  async devLogin() {
    return apiRequest("/auth/dev-login", { method: "POST" });
  },

  // Login using email/password UI – for now, just call devLogin()
  // so the button "works". Later you can connect to a real /auth/login.
  async login(email, password) {
    // TODO: replace with real login endpoint if you add one in backend
    return this.devLogin();
  },

  // Signup using email/password UI – for now, also call devLogin()
  async signup(email, password, name) {
    // TODO: replace with real signup endpoint if backend supports it
    return this.devLogin();
  },

  // Logout – frontend-only + optional backend call if you add /logout
  async logout() {
    // If you later add a backend endpoint, call it here, e.g.:
    // await apiRequest("/logout", { method: "POST" });

    // Clear local "logged in" flag
    localStorage.removeItem("noteai_logged_in");

    // Also try to clear uid cookie (dev login)
    document.cookie =
      "uid=; Max-Age=0; path=/; SameSite=Lax";

    return true;
  },

  //
  // NOTES CRUD
  //
  async listNotes() {
    return apiRequest("/notes", { method: "GET" });
  },

  async getNote(id) {
    return apiRequest(`/notes/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  },

  async createNote({ title, body }) {
    return apiRequest("/notes", {
      method: "POST",
      body: { title, body },
    });
  },

  async updateNote(id, patch) {
    // patch can contain: title, body, status, is_pinned, archived_at, trashed_at
    return apiRequest(`/notes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
    });
  },

  async deleteNote(id) {
    return apiRequest(`/notes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  //
  // SUMMARIZE
  //
  // Response:
  // {
  //   "note_id": "string",
  //   "summary": ["string"],
  //   "key_points": ["string"],
  //   "citations": [{ "quote": "string", "why": "string" }],
  //   "meta": {...}
  // }
  async summarizeNote({ note_id, text, language = "en", max_sentences = 5 }) {
    return apiRequest("/notes/summarize", {
      method: "POST",
      body: {
        note_id,
        text,
        options: {
          language,
          max_sentences,
        },
      },
    });
  },

  //
  // Q&A
  //
  // Response:
  // {
  //   "note_id": "string",
  //   "question": "string",
  //   "answer": "string",
  //   "citations": [{ "quote": "string", "why": "string" }],
  //   "meta": {...}
  // }
  async askNoteQuestion({ note_id, question, language = "en" }) {
    return apiRequest("/notes/qa", {
      method: "POST",
      body: {
        note_id,
        question,
        options: {
          language,
        },
      },
    });
  },
};

window.NoteAI = NoteAI;
