// frontend/SharedRepoo/assets/js/NotePage.js

document.addEventListener("DOMContentLoaded", () => {
  const noteBody = document.getElementById("note-body");
  const summarizeBtn = document.getElementById("summarize-btn");
  const summaryOutput = document.getElementById("summary-output");

  if (!noteBody || !summarizeBtn || !summaryOutput) {
    console.error("NotePage: missing HTML elements");
    return;
  }

  const API_BASE = "http://127.0.0.1:8000";
  let currentNoteId = null;

  summarizeBtn.addEventListener("click", async () => {
    const text = noteBody.value.trim();
    if (!text) {
      alert("Please enter some text before summarizing.");
      return;
    }

    const originalLabel = summarizeBtn.textContent;
    summarizeBtn.disabled = true;
    summarizeBtn.textContent = "Summarizing...";

    try {
      // 1) Create or update a note on the backend
      if (!currentNoteId) {
        // First time: create note
        const resCreate = await fetch(`${API_BASE}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: "New Note",
            body: text,
          }),
        });

        if (!resCreate.ok) {
          const err = await safeJson(resCreate);
          throw new Error(err.detail || resCreate.statusText);
        }

        const created = await resCreate.json();
        currentNoteId = created.id;
      } else {
        // Later: update existing note
        const resUpdate = await fetch(
          `${API_BASE}/notes/${encodeURIComponent(currentNoteId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ body: text }),
          }
        );

        if (!resUpdate.ok) {
          const err = await safeJson(resUpdate);
          throw new Error(err.detail || resUpdate.statusText);
        }
      }

      // 2) Call summarize endpoint
      const resSumm = await fetch(`${API_BASE}/notes/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          note_id: currentNoteId,
          text,
          options: {
            language: "en",
            max_sentences: 5,
          },
        }),
      });

      if (!resSumm.ok) {
        const err = await safeJson(resSumm);
        throw new Error(err.detail || resSumm.statusText);
      }

      const data = await resSumm.json();
      console.log("Summarize response:", data);

      renderSummary(summaryOutput, data);
    } catch (err) {
      console.error(err);
      alert("Failed to summarize: " + err.message);
    } finally {
      summarizeBtn.disabled = false;
      summarizeBtn.textContent = originalLabel;
    }
  });

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  function renderSummary(container, data) {
  const { summary } = data || {};
  let html = "";

  if (Array.isArray(summary) && summary.length > 0) {
    // Just join the summary sentences into paragraphs
    html = summary.map(escapeHtml).join("<br><br>");
  } else {
    html = "No summary returned.";
  }

  container.innerHTML = "<p>" + html + "</p>";
}

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
