(function () {
  const AUTH_EVENT = "calculus-auth-change";
  const COURSE_ID = "calculus-1a";
  const CHAPTER_ID = "1";
  const config = window.CALCULUS_RUNTIME_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || "").trim();
  const supabaseKey = String(config.supabaseAnonKey || config.supabasePublishableKey || "").trim();
  const supabaseSdkUrl = String(config.supabaseSdkUrl || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2").trim();
  const hasConfig = Boolean(supabaseUrl && supabaseKey);
  const isLocalDevHost = ["", "localhost", "127.0.0.1"].includes(location.hostname);
  const loginRequired = hasConfig || !isLocalDevHost;
  let client = null;
  let state = {
    mode: hasConfig ? "supabase" : "local",
    status: hasConfig ? "starting" : "local",
    session: null,
    user: null,
    error: null
  };

  function safeEmail(user) {
    return user?.email || "";
  }

  function isSignedIn() {
    return Boolean(state.user?.id && client);
  }

  function canUseCourse() {
    return !loginRequired || isSignedIn();
  }

  function setState(next) {
    state = { ...state, ...next };
    renderAuthPanel();
    document.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: getState() }));
  }

  function getState() {
    return {
      ...state,
      signedIn: isSignedIn(),
      email: safeEmail(state.user)
    };
  }

  // Header: the sign-in button exists only when sign-in can actually work.
  function renderAuthPanel() {
    const canSignIn = hasConfig && ["signed-out", "link-sent"].includes(state.status);
    document.querySelectorAll("[data-auth-open]").forEach((button) => {
      button.hidden = !canSignIn;
    });
    document.querySelectorAll("[data-account-state]").forEach((node) => {
      node.dataset.accountState = state.status;
    });
    const overlay = document.querySelector("#auth-overlay");
    if (overlay && !overlay.hidden) {
      if (state.status === "signed-in") closeAuthDialog();
      else renderAuthDialog(overlay);
    }
    renderAuthGate();
  }

  function bindAuthPanel() {
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-auth-open]");
      if (!opener) return;
      event.preventDefault();
      openAuthDialog(opener);
    });
  }

  function ensureAuthGate() {
    let gate = document.querySelector("#auth-gate");
    if (gate) return gate;
    gate = document.createElement("div");
    gate.id = "auth-gate";
    gate.className = "auth-gate";
    gate.hidden = true;
    gate.innerHTML = `
      <section class="auth-gate-card" role="region" aria-labelledby="auth-gate-title">
        <p class="eyebrow">כניסה נדרשת</p>
        <h1 id="auth-gate-title">מתחברים כדי להתחיל ללמוד</h1>
        <p data-auth-gate-copy>כדי להשתמש בקורס צריך ליצור חשבון או להיכנס עם מייל וסיסמה. ההתקדמות, המטבעות והפרופיל יישמרו בחשבון.</p>
        <div class="auth-gate-actions">
          <button class="action primary" type="button" data-auth-gate-open>כניסה או הרשמה</button>
        </div>
        <p class="auth-gate-note" data-auth-gate-note role="status"></p>
      </section>
    `;
    gate.querySelector("[data-auth-gate-open]")?.addEventListener("click", (event) => {
      event.preventDefault();
      openAuthDialog(event.currentTarget);
    });
    document.body.append(gate);
    return gate;
  }

  function renderAuthGate() {
    const locked = loginRequired && !isSignedIn();
    document.body.classList.toggle("auth-required", locked);
    document.body.classList.remove("auth-pending");
    document.querySelector(".layout")?.toggleAttribute("inert", locked);

    const gate = document.querySelector("#auth-gate") || (loginRequired ? ensureAuthGate() : null);
    if (!gate) return;
    gate.hidden = !locked;
    if (!locked) return;

    const copy = gate.querySelector("[data-auth-gate-copy]");
    const note = gate.querySelector("[data-auth-gate-note]");
    const button = gate.querySelector("[data-auth-gate-open]");
    const canOpen = hasConfig && !["starting", "error"].includes(state.status);

    if (copy) {
      if (!hasConfig) {
        copy.textContent = "הכניסה לא מוגדרת כרגע, ולכן הקורס נעול. צריך להגדיר Supabase לפני שימוש באתר.";
      } else if (state.status === "starting") {
        copy.textContent = "בודקים אם כבר יש חיבור לחשבון במכשיר הזה.";
      } else if (state.status === "link-sent") {
        copy.textContent = `שלחנו קישור כניסה${lastEmail ? ` ל־${lastEmail}` : ""}. אחרי פתיחת הקישור הקורס ייפתח כאן.`;
      } else if (state.status === "error") {
        copy.textContent = "לא הצלחנו להפעיל את מערכת הכניסה. כדאי לרענן את הדף או לבדוק את החיבור.";
      } else {
        copy.textContent = "כדי להשתמש בקורס צריך ליצור חשבון או להיכנס עם מייל וסיסמה. ההתקדמות, המטבעות והפרופיל יישמרו בחשבון.";
      }
    }
    if (note) {
      note.textContent = state.status === "link-sent"
        ? "פתחי את הקישור מהמייל באותו דפדפן."
        : "הסיסמה היא לחשבון באתר בלבד, לא סיסמת המייל האישי.";
    }
    if (button) {
      button.disabled = !canOpen;
      button.textContent = state.status === "link-sent" ? "פתיחת מסך הכניסה" : "כניסה או הרשמה";
    }
  }

  function ensureAuthDialog() {
    let overlay = document.querySelector("#auth-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.className = "question-overlay auth-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="question-overlay-backdrop" data-close-auth-dialog></div>
      <section class="question-dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" tabindex="-1">
        <button class="question-close" type="button" aria-label="סגירה" data-close-auth-dialog>×</button>
        <div class="profile-dialog-head">
          <h3 id="auth-dialog-title">כניסה</h3>
          <p class="dialog-lead">יצירת חשבון או כניסה עם סיסמה. ההתקדמות, המטבעות והפרופיל יחכו לך בכל מכשיר.</p>
        </div>
        <div class="auth-dialog-body" data-auth-dialog-body></div>
      </section>
    `;
    document.body.append(overlay);
    overlay.addEventListener("click", (event) => {
      if (!event.target.closest("[data-close-auth-dialog]")) return;
      event.preventDefault();
      closeAuthDialog();
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAuthDialog();
      } else if (event.key === "Tab") {
        trapFocus(event, overlay.querySelector(".auth-dialog"));
      }
    });
    return overlay;
  }

  let authReturnFocus = null;

  function openAuthDialog(opener = document.activeElement) {
    if (!hasConfig || state.status === "error" || state.status === "starting") return;
    authReturnFocus = opener;
    if (state.error) state = { ...state, error: null };
    const overlay = ensureAuthDialog();
    renderAuthDialog(overlay);
    overlay.hidden = false;
    document.body.classList.add("question-modal-open");
    requestAnimationFrame(() => {
      (overlay.querySelector("[data-auth-email]") || overlay.querySelector(".auth-dialog"))?.focus({ preventScroll: true });
    });
  }

  function closeAuthDialog() {
    const overlay = document.querySelector("#auth-overlay");
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    if (!document.querySelector(".question-overlay:not([hidden])")) {
      document.body.classList.remove("question-modal-open");
    }
    if (authReturnFocus?.isConnected && !authReturnFocus.closest("[hidden]")) authReturnFocus.focus({ preventScroll: true });
    authReturnFocus = null;
  }

  function trapFocus(event, container) {
    if (!container) return;
    const focusable = [...container.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]")]
      .filter((node) => node.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function loadSupabaseSdk() {
    if (window.supabase?.createClient) return Promise.resolve(true);
    return new Promise((resolve) => {
      const existing = document.querySelector("script[data-supabase-sdk]");
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = supabaseSdkUrl;
      script.defer = true;
      script.dataset.supabaseSdk = "true";
      script.addEventListener("load", () => resolve(Boolean(window.supabase?.createClient)), { once: true });
      script.addEventListener("error", () => resolve(false), { once: true });
      document.head.append(script);
    });
  }

  // Supabase errors arrive in English; learners see a short Hebrew explanation instead.
  function friendlyError(error) {
    const text = String(error?.message || error || "").toLowerCase();
    if (/rate|too many|seconds/.test(text)) return "נשלחו יותר מדי בקשות ברצף. אפשר לנסות שוב בעוד דקה.";
    if (/invalid login|invalid credentials|credentials/.test(text)) return "המייל או הסיסמה לא נכונים.";
    if (/already registered|already exists|user.*exists/.test(text)) return "כבר יש חשבון לכתובת הזו. אפשר לעבור לכניסה.";
    if (/password|weak|short|characters/.test(text)) return "הסיסמה צריכה להיות לפחות 6 תווים.";
    if (/signup|signups|not allowed|disabled/.test(text)) return "ההרשמה סגורה כרגע בהגדרות Supabase.";
    if (/confirm|confirmed/.test(text)) return "החשבון נוצר, אבל Supabase עדיין דורש אישור מייל. צריך לכבות Confirm email או לאשר מהמייל.";
    if (/invalid|email/.test(text)) return "כתובת המייל לא נראית תקינה. כדאי לבדוק ולנסות שוב.";
    if (/network|fetch|failed/.test(text)) return "אין חיבור כרגע. צריך חיבור כדי להיכנס לקורס.";
    return "לא הצלחנו להשלים את הפעולה כרגע. אפשר לנסות שוב בעוד רגע.";
  }

  let lastEmail = "";
  let authMode = "password-sign-in";

  function renderAuthDialog(overlay = document.querySelector("#auth-overlay")) {
    if (!overlay) return;
    const body = overlay.querySelector("[data-auth-dialog-body]");
    if (!body) return;
    if (state.status === "signed-in") {
      body.innerHTML = `
        <div class="auth-signed-in">
          <span>מחוברים לחשבון</span>
          <bdi>${escapeHtml(safeEmail(state.user))}</bdi>
        </div>
        <div class="profile-actions">
          <button class="action" type="button" data-auth-sign-out>יציאה מהחשבון</button>
        </div>
      `;
      body.querySelector("[data-auth-sign-out]")?.addEventListener("click", async () => {
        await signOut();
        closeAuthDialog();
        window.CalculusProfile?.afterSignOut?.();
      });
      return;
    }
    if (state.status === "link-sent") {
      body.innerHTML = `
        <div class="auth-sent" role="status">
          <span class="auth-sent-mark" aria-hidden="true">✓</span>
          <div>
            <strong>שלחנו קישור כניסה</strong>
            <p>לכתובת <bdi>${escapeHtml(lastEmail)}</bdi>. כדאי לפתוח אותו באותו מכשיר ובאותו דפדפן.</p>
          </div>
        </div>
        <div class="profile-actions">
          <button class="action primary" type="button" data-close-auth-dialog>סגירה</button>
          <button class="action" type="button" data-auth-change-email>שליחה לכתובת אחרת</button>
        </div>
      `;
      body.querySelector("[data-auth-change-email]")?.addEventListener("click", () => {
        authMode = "magic-link";
        setState({ status: "signed-out", error: null });
        renderAuthDialog(overlay);
        overlay.querySelector("[data-auth-email]")?.focus();
      });
      return;
    }
    const isSignUp = authMode === "sign-up";
    const isMagicLink = authMode === "magic-link";
    body.innerHTML = `
      <div class="auth-mode-switch" aria-label="בחירת פעולה">
        <button type="button" class="${authMode === "password-sign-in" ? "is-active" : ""}" aria-pressed="${authMode === "password-sign-in"}" data-auth-mode="password-sign-in">כניסה</button>
        <button type="button" class="${isSignUp ? "is-active" : ""}" aria-pressed="${isSignUp}" data-auth-mode="sign-up">יצירת חשבון</button>
      </div>
      ${isMagicLink ? `
        <form class="auth-form" data-auth-magic-form novalidate>
          <label for="auth-email">כתובת מייל</label>
          <input id="auth-email" type="email" autocomplete="email" inputmode="email" dir="ltr" required data-auth-email value="${escapeHtml(lastEmail)}" aria-describedby="auth-message">
          <p class="auth-hint">נשלח קישור כניסה. האפשרות הזו תלויה במשלוח מיילים מ־Supabase.</p>
          <p class="auth-message${state.error ? " error" : ""}" id="auth-message" data-auth-message role="alert">${state.error ? escapeHtml(state.error) : ""}</p>
          <button class="action primary" type="submit">שליחת קישור כניסה</button>
        </form>
        <p class="auth-alt"><button class="text-button" type="button" data-auth-mode="password-sign-in">חזרה לכניסה עם סיסמה</button></p>
      ` : `
        <form class="auth-form" data-auth-password-form novalidate>
          <label for="auth-email">כתובת מייל</label>
          <input id="auth-email" type="email" autocomplete="email" inputmode="email" dir="ltr" required data-auth-email value="${escapeHtml(lastEmail)}" aria-describedby="auth-message">
          <label for="auth-password">סיסמה</label>
          <input id="auth-password" type="password" autocomplete="${isSignUp ? "new-password" : "current-password"}" minlength="6" required data-auth-password aria-describedby="auth-message">
          <p class="auth-hint">${isSignUp ? "בחרי סיסמה לאתר הזה בלבד. לא להשתמש בסיסמת המייל או האוניברסיטה." : "הכניסה היא עם הסיסמה שבחרת בהרשמה לאתר."}</p>
          <p class="auth-message${state.error ? " error" : ""}" id="auth-message" data-auth-message role="alert">${state.error ? escapeHtml(state.error) : ""}</p>
          <button class="action primary" type="submit">${isSignUp ? "יצירת חשבון" : "כניסה"}</button>
        </form>
        <p class="auth-alt"><button class="text-button" type="button" data-auth-mode="magic-link">כניסה בקישור למייל</button></p>
      `}
    `;
    body.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        authMode = button.dataset.authMode || "password-sign-in";
        if (state.error) state = { ...state, error: null };
        renderAuthDialog(overlay);
        overlay.querySelector("[data-auth-email]")?.focus();
      });
    });
    body.querySelector("[data-auth-magic-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const input = form.querySelector("[data-auth-email]");
      const email = input?.value?.trim() || "";
      const messageNode = body.querySelector("[data-auth-message]");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        messageNode.textContent = "כדאי לבדוק את כתובת המייל.";
        messageNode.classList.add("error");
        input?.focus();
        return;
      }
      const button = form.querySelector("button[type='submit']");
      button?.setAttribute("disabled", "disabled");
      if (button) button.textContent = "שולחים…";
      messageNode.textContent = "";
      lastEmail = email;
      const result = await signInWithEmail(email);
      if (!result.ok) {
        button?.removeAttribute("disabled");
        if (button) button.textContent = "שליחת קישור כניסה";
        messageNode.textContent = result.error;
        messageNode.classList.add("error");
      }
    });
    body.querySelector("[data-auth-password-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const emailInput = form.querySelector("[data-auth-email]");
      const passwordInput = form.querySelector("[data-auth-password]");
      const email = emailInput?.value?.trim() || "";
      const password = passwordInput?.value || "";
      const messageNode = body.querySelector("[data-auth-message]");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        messageNode.textContent = "כדאי לבדוק את כתובת המייל.";
        messageNode.classList.add("error");
        emailInput?.focus();
        return;
      }
      if (password.length < 6) {
        messageNode.textContent = "הסיסמה צריכה להיות לפחות 6 תווים.";
        messageNode.classList.add("error");
        passwordInput?.focus();
        return;
      }
      const button = form.querySelector("button[type='submit']");
      button?.setAttribute("disabled", "disabled");
      if (button) button.textContent = isSignUp ? "יוצרים חשבון…" : "נכנסים…";
      messageNode.textContent = "";
      messageNode.classList.remove("error");
      lastEmail = email;
      const result = isSignUp
        ? await signUpWithPassword(email, password)
        : await signInWithPassword(email, password);
      if (!result.ok) {
        button?.removeAttribute("disabled");
        if (button) button.textContent = isSignUp ? "יצירת חשבון" : "כניסה";
        messageNode.textContent = result.error;
        messageNode.classList.add("error");
        return;
      }
      if (result.message) {
        button?.removeAttribute("disabled");
        if (button) button.textContent = isSignUp ? "יצירת חשבון" : "כניסה";
        messageNode.textContent = result.message;
        messageNode.classList.remove("error");
      }
    });
  }

  async function signInWithPassword(email, password) {
    if (!client) return { ok: false, error: friendlyError("") };
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setState({ status: "signed-out", error: friendlyError(error) });
      return { ok: false, error: friendlyError(error) };
    }
    if (data?.session?.user) {
      setState({ status: "signed-in", session: data.session, user: data.session.user, error: null });
      return { ok: true, signedIn: true };
    }
    return { ok: true, signedIn: false, message: "הכניסה נקלטה, אבל לא נוצר session. כדאי לרענן ולנסות שוב." };
  }

  async function signUpWithPassword(email, password) {
    if (!client) return { ok: false, error: friendlyError("") };
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
      setState({ status: "signed-out", error: friendlyError(error) });
      return { ok: false, error: friendlyError(error) };
    }
    if (data?.session?.user) {
      setState({ status: "signed-in", session: data.session, user: data.session.user, error: null });
      return { ok: true, signedIn: true };
    }
    return {
      ok: true,
      signedIn: false,
      message: "החשבון נוצר, אבל Supabase עדיין דורש אישור מייל. אם כיבית Confirm email, רענני ונסי להיכנס."
    };
  }

  async function signInWithEmail(email) {
    if (!client) return { ok: false, error: friendlyError("") };
    // Redirect to the app root, not only the domain. Project Pages live under
    // /calculus-1a-interactive/, while local checks live at the server root.
    const redirectTo = authRedirectUrl();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) {
      setState({ status: "signed-out", error: friendlyError(error) });
      return { ok: false, error: friendlyError(error) };
    }
    setState({ status: "link-sent", error: null });
    return { ok: true };
  }

  function authRedirectUrl() {
    const current = new URL(location.href);
    current.hash = "";
    current.search = "";
    if (current.pathname === "/" || current.pathname === "") {
      return current.origin;
    }
    if (!current.pathname.endsWith("/")) {
      current.pathname = current.pathname.replace(/[^/]*$/, "");
    }
    return current.href;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setState({ status: "signed-out", session: null, user: null, error: null });
  }

  async function fetchProfile() {
    if (!isSignedIn()) return null;
    const { data, error } = await client
      .from("profiles")
      .select("nickname, avatar_id, updated_at")
      .eq("user_id", state.user.id)
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }

  async function saveProfile(profile) {
    if (!isSignedIn() || !profile?.nickname) return { ok: false };
    const row = {
      user_id: state.user.id,
      nickname: profile.nickname,
      avatar_id: profile.avatarId || profile.avatar_id || "noether",
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from("profiles").upsert(row, { onConflict: "user_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function fetchUnitProgress() {
    if (!isSignedIn()) return [];
    const { data, error } = await client
      .from("unit_progress")
      .select("unit_id, passed, best_score, mistakes, total_questions, completed_at, updated_at")
      .eq("course_id", COURSE_ID)
      .eq("chapter_id", CHAPTER_ID);
    if (error) throw error;
    return data || [];
  }

  async function saveUnitProgress(unitId, unitProgress) {
    if (!isSignedIn() || !unitId || !unitProgress) return { ok: false };
    const row = {
      user_id: state.user.id,
      course_id: COURSE_ID,
      chapter_id: CHAPTER_ID,
      unit_id: unitId,
      passed: Boolean(unitProgress.passed || unitProgress.quizPassed),
      best_score: typeof unitProgress.best === "number" ? unitProgress.best : null,
      mistakes: typeof unitProgress.mistakes === "number" ? unitProgress.mistakes : null,
      total_questions: typeof unitProgress.total === "number" ? unitProgress.total : null,
      completed_at: unitProgress.passed || unitProgress.quizPassed ? (unitProgress.updatedAt || new Date().toISOString()) : null,
      updated_at: unitProgress.updatedAt || new Date().toISOString()
    };
    const { error } = await client
      .from("unit_progress")
      .upsert(row, { onConflict: "user_id,course_id,chapter_id,unit_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function fetchLearningState() {
    if (!isSignedIn()) return null;
    const { data, error } = await client
      .from("learning_state")
      .select("progress, updated_at")
      .eq("course_id", COURSE_ID)
      .eq("chapter_id", CHAPTER_ID)
      .eq("user_id", state.user.id)
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }

  async function saveLearningState(progress) {
    if (!isSignedIn() || !progress) return { ok: false };
    const row = {
      user_id: state.user.id,
      course_id: COURSE_ID,
      chapter_id: CHAPTER_ID,
      progress,
      updated_at: new Date().toISOString()
    };
    const { error } = await client
      .from("learning_state")
      .upsert(row, { onConflict: "user_id,course_id,chapter_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function saveQuestionAttempts(questionStats) {
    if (!isSignedIn() || !Array.isArray(questionStats) || !questionStats.length) return { ok: false };
    const rows = questionStats.map((item) => ({
      user_id: state.user.id,
      course_id: COURSE_ID,
      chapter_id: CHAPTER_ID,
      unit_id: item.unitId || "",
      question_id: item.questionId || "",
      topic: item.topic || item.unitTitle || "כללי",
      correct: Boolean(item.correct),
      had_mistake: Boolean(item.hadMistake),
      first_answer_ms: Math.max(0, Number(item.firstCheckMs) || 0),
      attempts: Math.max(1, Number(item.attempts) || 1)
    }));
    const { error } = await client.from("question_attempts").insert(rows);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function saveCoinEvent(amount, reason, unitId = null) {
    if (!isSignedIn() || !amount) return { ok: false };
    const row = {
      user_id: state.user.id,
      amount,
      reason,
      course_id: COURSE_ID,
      unit_id: unitId
    };
    const { error } = await client.from("coin_events").insert(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function saveHintPurchase(hintId, cost) {
    if (!isSignedIn() || !hintId) return { ok: false };
    const row = {
      user_id: state.user.id,
      hint_id: hintId,
      cost: cost || 5,
      purchased_at: new Date().toISOString()
    };
    const { error } = await client
      .from("hint_purchases")
      .upsert(row, { onConflict: "user_id,hint_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function initSupabase() {
    bindAuthPanel();
    renderAuthPanel();
    if (!hasConfig) {
      setState({ status: "local" });
      return;
    }
    const sdkReady = await loadSupabaseSdk();
    if (!sdkReady || !window.supabase?.createClient) {
      setState({ status: "error", error: null });
      return;
    }
    client = window.supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    client.auth.onAuthStateChange((event, session) => {
      setState({
        status: session?.user ? "signed-in" : "signed-out",
        session: session || null,
        user: session?.user || null,
        error: null,
        lastEvent: event
      });
    });
    const { data, error } = await client.auth.getSession();
    if (error) {
      setState({ status: "error", error: null, session: null, user: null });
      return;
    }
    setState({
      status: data?.session?.user ? "signed-in" : "signed-out",
      session: data?.session || null,
      user: data?.session?.user || null,
      error: null
    });
  }

  window.CalculusAuth = {
    getState,
    isAvailable: () => hasConfig,
    requiresSignIn: () => loginRequired,
    canUseCourse,
    openSignIn: openAuthDialog,
    signInWithEmail,
    signOut,
    fetchProfile,
    saveProfile,
    fetchUnitProgress,
    saveUnitProgress,
    fetchLearningState,
    saveLearningState,
    saveQuestionAttempts,
    saveCoinEvent,
    saveHintPurchase,
    onChange(callback) {
      const handler = (event) => callback(event.detail);
      document.addEventListener(AUTH_EVENT, handler);
      callback(getState());
      return () => document.removeEventListener(AUTH_EVENT, handler);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSupabase, { once: true });
  } else {
    initSupabase();
  }
})();
