(() => {
  const statusEl = document.querySelector("[data-signup-status]");
  const signupForm = document.querySelector("[data-signup-form]");
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

  const normalizePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
    return "";
  };

  const getRedirectPath = () => {
    const path = window.location.pathname || "/";
    if (path.endsWith("/signup.html")) {
      return path.replace(/signup\.html$/, "");
    }
    if (path.endsWith("/")) return path;
    return path.replace(/[^/]+$/, "");
  };

  const getReturnTo = () => {
    const stored = sessionStorage.getItem("gt_return_to");
    if (!stored || stored.includes("login.html") || stored.includes("signup.html")) return "account.html";
    return stored;
  };

  const redirectAfterAuth = () => {
    const target = getReturnTo();
    sessionStorage.removeItem("gt_return_to");
    window.location.href = target;
  };

  const boot = async () => {
    if (!window.GTStore?.getSession) return;
    const session = await window.GTStore.getSession();
    if (session) {
      redirectAfterAuth();
    }
  };

  const ensureProfile = async (client, session, overrides = {}) => {
    if (!session?.user?.id) return;
    const meta = session?.user?.user_metadata || {};
    const payload = {
      id: session.user.id,
      full_name: overrides.full_name || meta.full_name || meta.name || "",
      phone: overrides.phone || meta.phone || "",
      phone_e164: normalizePhone(overrides.phone || meta.phone || "") || null,
      phone_verified: false,
      verified_phone: null,
      phone_verified_at: null,
      email: overrides.email || session?.user?.email || ""
    };
    await client.from("profiles").upsert(payload);
  };

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const client = requireClient();
      if (!client) return;
      const email = signupForm.querySelector("[name=\"email\"]").value.trim();
      const password = signupForm.querySelector("[name=\"password\"]").value;
      const fullName = signupForm.querySelector("[name=\"full_name\"]").value.trim();
      const phone = signupForm.querySelector("[name=\"phone\"]").value.trim();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone
          }
        }
      });
      if (error) {
        setStatus(error.message, true);
        return;
      }
      if (data?.session) {
        await ensureProfile(client, data.session, { full_name: fullName, phone, email });
        setStatus("Account created. Redirecting...", false);
        redirectAfterAuth();
        return;
      }
      setStatus("Check your email to confirm your account.", false);
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

  boot();
})();
