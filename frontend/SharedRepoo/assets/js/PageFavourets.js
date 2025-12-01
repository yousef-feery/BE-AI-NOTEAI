// frontend/SharedRepoo/assets/js/PageFavorites.js

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:8000";
  const listEl = document.getElementById("favorites-list");
  if (!listEl) {
    console.warn("Favorites list element #favorites-list not found.");
    return;
  }

  async function loadFavorites() {
    try {
      // IMPORTANT: call the favorites endpoint, not /notes
      const res = await fetch(`${API_BASE}/notes/me/favorites`, {
        method: "GET",
        credentials: "include",
      });

      let raw;
      try {
        raw = await res.json();
      } catch {
        raw = [];
      }

      if (!res.ok) {
        throw new Error(
          (raw && raw.detail) || res.statusText || "Failed to load favourites"
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

      renderFavorites(notes);
    } catch (err) {
      console.error(err);
      listEl.innerHTML = `<p>Failed to load favourites: ${escapeHtml(
        err.message
      )}</p>`;
    }
  }

  function renderFavorites(notes) {
    listEl.innerHTML = "";

    if (!notes.length) {
      const p = document.createElement("p");
      p.textContent = "No favourites yet.";
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
            <button type="button" data-action="unpin">Unpin</button>
          </div>
        </div>
      `;

      const dropdown = article.querySelector(".menu-dropdown");
      const menuBtn = article.querySelector(".menu-btn");
      dropdown.style.display = "none";

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

      const unpinBtn = dropdown.querySelector('[data-action="unpin"]');
      unpinBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        dropdown.style.display = "none";
        try {
          // backend already supports this (you see 204 in logs)
          await fetch(
            `${API_BASE}/notes/${encodeURIComponent(note.id)}/favorite`,
            { method: "DELETE", credentials: "include" }
          );
          await loadFavorites();
        } catch (err) {
          console.error(err);
          alert("Failed to unpin note: " + err.message);
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

  loadFavorites();
});
