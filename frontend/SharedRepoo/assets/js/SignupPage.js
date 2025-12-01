// frontend/SharedRepoo/assets/js/SignupPage.js

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("signup-name");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const signupBtn = document.getElementById("signup-btn");

  if (!signupBtn) return;

  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      // Call NoteAI.signup (currently uses devLogin)
      await window.NoteAI.signup(email, password, name);

      // Mark as logged in on frontend
      localStorage.setItem("noteai_logged_in", "1");

      // Redirect to dashboard
      window.location.href = "Dashboard.html";
    } catch (err) {
      console.error(err);
      alert("Signup failed: " + err.message);
    }
  });
});
