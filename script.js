console.log("Welcome to Vought International.");
const signupForm = document.getElementById("signupForm");
const signupButton = document.getElementById("signupButton");
const signupMessage = document.getElementById("signupMessage");

function setSignupMessage(message, type = "") {
  signupMessage.textContent = message;
  signupMessage.className = `signup-message ${type}`.trim();
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();

    signupButton.disabled = true;
    signupButton.textContent = "Sending...";
    setSignupMessage("Sending verification email...", "pending");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed.");
      }

      setSignupMessage("Check your email for the verification link.", "success");
      signupForm.reset();
    } catch (error) {
      setSignupMessage(error.message || "Something went wrong.", "error");
    } finally {
      signupButton.disabled = false;
      signupButton.textContent = "Sign Up";
    }
  });
}
