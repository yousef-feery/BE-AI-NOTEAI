// frontend/SharedRepoo/assets/js/PageArchieve.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:8000";
  const listEl = document.getElementById("archive-list");
  if (!listEl) {
    console.warn("Archive list element #archive-list not found.");
    return;
  }

  async function loadArchivedNotes() {
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: "GET",
        credentials: "include",
      });

      let raw = null;
      try {
        raw = await res.json();
      } catch (_) {
        raw = [];
      }

      if (!res.ok) {
        throw new Error(
          (raw && raw.detail) || res.statusText || "Failed to load notes"
        );
      }

      // Normalize shape: [], {items: []}, or single object
      let notes = [];
      if (Array.isArray(raw)) {
        notes = raw;
      } else if (raw && Array.isArray(raw.items)) {
        notes = raw.items;
      } else if (raw && typeof raw === "object" && raw.id) {
        notes = [raw];
      }

      const archived = notes.filter((n) => {
        if (!n) return false;
        if (n.status && String(n.status).toUpperCase() === "ARCHIVED") return true;
        if (n.archived_at) return true;
        return false;
      });

      renderArchived(archived);
    } catch (err) {
      console.error(err);
      listEl.innerHTML = `<p>Failed to load archived notes: ${escapeHtml(
        err.message
      )}</p>`;
    }
  }

  function renderArchived(notes) {
    listEl.innerHTML = "";

    if (!notes.length) {
      const p = document.createElement("p");
      p.textContent = "No archived notes.";
      listEl.appendChild(p);
      return;
    }

    notes.forEach((note) => {
      const title = note.title || "(untitled)";
      const body = note.body || "";
      const snippet =
        body.length > 160
          ? body.slice(0, 160).replace(/\s+\S*$/, "") + "…"
          : body;

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
            <button type="button" data-action="restore">Restore</button>
            <button type="button" data-action="delete">Delete permanently</button>
          </div>
        </div>
      `;

      const dropdown = article.querySelector(".menu-dropdown");
      const menuBtn = article.querySelector(".menu-btn");
      dropdown.style.display = "none";

      // Toggle dropdown
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".menu-dropdown").forEach((dd) => {
          if (dd !== dropdown) dd.style.display = "none";
        });
        dropdown.style.display =
          dropdown.style.display === "none" || dropdown.style.display === ""
            ? "block"
            : "none";
      });

      // Optional: wire restore & hard delete later if you like
      const restoreBtn = dropdown.querySelector('[data-action="restore"]');
      const deleteBtn = dropdown.querySelector('[data-action="delete"]');

      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        dropdown.style.display = "none";
        try {
          await fetch(
            `${API_BASE}/notes/${encodeURIComponent(note.id)}/restore`,
            { method: "POST", credentials: "include" }
          );
          await loadArchivedNotes();
        } catch (err) {
          console.error(err);
          alert("Failed to restore note: " + err.message);
        }
      });

      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        dropdown.style.display = "none";
        if (!confirm("Delete this note permanently?")) return;
        try {
          await fetch(`${API_BASE}/notes/${encodeURIComponent(note.id)}`, {
            method: "DELETE",
            credentials: "include",
          });
          await loadArchivedNotes();
        } catch (err) {
          console.error(err);
          alert("Failed to delete note: " + err.message);
        }
      });

      listEl.appendChild(article);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Close menus when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".menu-dropdown").forEach((dd) => {
      dd.style.display = "none";
    });
  });

  loadArchivedNotes();
});
