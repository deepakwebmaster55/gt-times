(() => {
  const statusEl = document.querySelector("[data-login-status]");
  const loginForm = document.querySelector("[data-login-form]");
  const googleBtn = document.querySelector("[data-google-login]");

  const setStatus = (text, isError) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.classList.toggle("is-success", !isError);
  };

  const requireClient = () => {
    const client = window.GTStore?.client;
    if (!client) {
      setStatus("Supabase 3 keys missing in assets/js/config.js", true);
      return null;
    }
    return client;
  };

  const getRedirectPath = () => {
    const path = window.location.pathname || "/";
    if (path.endsWith("/login.html")) {
      return path.replace(/login\.html$/, "");
    }
    if (path.endsWith("/")) return path;
    return path.replace(/[^/]+$/, "");
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const email = loginForm.querySelector("[name=\"email\"]").value.trim();
      const password = loginForm.querySelector("[name=\"password\"]").value;
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message, true);
        return;
      }
      if (data?.session) {
        setStatus("Login successful. Redirecting...", false);
        window.location.href = "account.html";
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      const client = requireClient();
      if (!client) return;
      const base = getRedirectPath();
      const redirectTo = `${window.location.origin}${base}account.html`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (error) {
        setStatus(error.message, true);
      }
    });
  }
})();
