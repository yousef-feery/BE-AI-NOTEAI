// Make sure JS is loaded
console.log("PageThreePageFour.js loaded!");
 
document.addEventListener("DOMContentLoaded", () => {
 
  const summarizeBtn = document.getElementById("summarizeBtn");
  const inputField = document.getElementById("noteInput");
  const summaryOutput = document.getElementById("summaryOutput");
 
  summarizeBtn.addEventListener("click", async () => {
    console.log("Summarize button clicked!");
 
    const text = inputField.value.trim();
 
    if (!text) {
      alert("Please enter some text first!");
      return;
    }
 
    // The backend summarize endpoint
    const API_URL = "http://127.0.0.1:8000/notes/summarize";
 
    // Get or create user_id
    let userId = localStorage.getItem("user_id");
    console.log("Current user_id in localStorage:", userId);
 
    if (!userId) {
      console.log("No user_id found, attempting to create one...");
      try {
        const loginResponse = await fetch("http://127.0.0.1:8000/auth/dev-login", {
          method: "POST",
          credentials: "include"
        });
        console.log("Login response status:", loginResponse.status);
        const loginData = await loginResponse.json();
        console.log("Login response data:", loginData);
        userId = loginData.user_id;
        localStorage.setItem("user_id", userId);
        console.log("Created new user_id:", userId);
      } catch (err) {
        console.error("Login error:", err);
        alert("Failed to create user session. Please refresh and try again.");
        return;
      }
    }
 
    try {
      summarizeBtn.disabled = true;
      summarizeBtn.innerText = "Summarizing...";
 
      summaryOutput.innerHTML = "<p>⏳ Summarizing...</p>";
 
      console.log("Sending request to:", API_URL);
      console.log("With headers - X-User-Id:", userId);
      console.log("Request body:", {
        note_id: "new-note",
        text: text,
        options: {
          language: "en",
          max_sentences: 5
        }
      });
 
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId
        },
        body: JSON.stringify({
          note_id: "new-note",
          text: text,
          options: {
            language: "en",
            max_sentences: 5
          }
        })
      });
 
      console.log("Response status:", response.status);
 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData);
        summaryOutput.innerHTML = `<p style="color:red;">Error: ${response.status} - ${errorData.detail || response.statusText}</p>`;
        throw new Error(`Backend returned status ${response.status}: ${errorData.detail || response.statusText}`);
      }
 
      const data = await response.json();
      console.log("Summary response:", data);
 
      // Display summary
      summaryOutput.innerHTML = `
        <h3>Summary:</h3>
        <p class="summary-output">${data.summary || "No summary returned."}</p>
      `;
 
    } catch (error) {
      console.error("Summarize error:", error);
      summaryOutput.innerHTML = `<p style="color:red;">Failed to summarize: ${error.message}</p>`;
    } finally {
      summarizeBtn.disabled = false;
      summarizeBtn.innerText = "Summarize";
    }
  });
});