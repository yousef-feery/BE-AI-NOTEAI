// frontend/SharedRepoo/assets/js/LoginPage.js

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const loginBtn = document.getElementById("login-btn");

  if (!loginBtn) return;

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      // Call our NoteAI.login (currently wraps devLogin)
      await window.NoteAI.login(email, password);

      // Mark as logged in on frontend
      localStorage.setItem("noteai_logged_in", "1");

      // Redirect to dashboard
      window.location.href = "Dashboard.html";
    } catch (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    }
  });
});
