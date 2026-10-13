(function () {
  const AUTH_EVENT = "calculus-auth-change";
  const COURSE_ID = "calculus-1a";
  const CHAPTER_ID = "1";
  const config = window.CALCULUS_RUNTIME_CONFIG || {};
  const supabaseUrl = String(config.supabaseUrl || "").trim();
  const supabaseKey = String(config.supabaseAnonKey || config.supabasePublishableKey || "").trim();
  const supabaseSdkUrl = String(config.supabaseSdkUrl || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2").trim();
  const hasConfig = Boolean(supabaseUrl && supabaseKey);
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

  function renderAuthPanel() {
    const panel = document.querySelector("[data-auth-panel]");
    if (!panel) return;
    panel.hidden = !hasConfig;
    const button = panel.querySelector("[data-auth-open]");
    const status = panel.querySelector("[data-auth-status]");
    if (status) {
      if (state.status === "signed-in") status.textContent = safeEmail(state.user);
      else if (state.status === "error") status.textContent = "כניסה לא זמינה";
      else status.textContent = "שמירה בחשבון";
    }
    if (button) button.textContent = state.status === "signed-in" ? "חשבון" : "כניסה";
  }

  function bindAuthPanel() {
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-auth-open]");
      if (!opener) return;
      event.preventDefault();
      openAuthDialog();
    });
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
        <button class="question-close" type="button" aria-label="חזרה לקורס" data-close-auth-dialog>×</button>
        <div class="profile-dialog-head">
          <p>חשבון אישי</p>
          <h3 id="auth-dialog-title">כניסה לקורס</h3>
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
    return overlay;
  }

  function openAuthDialog() {
    if (!hasConfig) return;
    const overlay = ensureAuthDialog();
    renderAuthDialog(overlay);
    overlay.hidden = false;
    document.body.classList.add("question-modal-open");
    requestAnimationFrame(() => {
      overlay.querySelector("input, button, .auth-dialog")?.focus({ preventScroll: true });
    });
  }

  function closeAuthDialog() {
    const overlay = document.querySelector("#auth-overlay");
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("question-modal-open");
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

  function renderAuthDialog(overlay = document.querySelector("#auth-overlay")) {
    if (!overlay) return;
    const body = overlay.querySelector("[data-auth-dialog-body]");
    if (!body) return;
    if (state.status === "signed-in") {
      body.innerHTML = `
        <p class="auth-copy">ההתקדמות תישמר בחשבון הזה.</p>
        <div class="auth-signed-in">
          <strong>${escapeHtml(safeEmail(state.user))}</strong>
          <button class="action" type="button" data-auth-sign-out>יציאה</button>
        </div>
      `;
      body.querySelector("[data-auth-sign-out]")?.addEventListener("click", async () => {
        await signOut();
        renderAuthDialog(overlay);
      });
      return;
    }
    const message = state.error
      ? `<p class="auth-message error">${escapeHtml(state.error)}</p>`
      : `<p class="auth-copy">נשלח אלייך קישור כניסה למייל. אחרי הכניסה ההתקדמות תישמר בחשבון.</p>`;
    body.innerHTML = `
      ${message}
      <form class="auth-form" data-auth-form>
        <label>
          <span>אימייל</span>
          <input type="email" autocomplete="email" inputmode="email" required data-auth-email>
        </label>
        <button class="action primary" type="submit">שליחת קישור כניסה</button>
      </form>
      <p class="auth-message" data-auth-message></p>
    `;
    body.querySelector("[data-auth-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const email = form.querySelector("[data-auth-email]")?.value?.trim();
      const messageNode = body.querySelector("[data-auth-message]");
      if (!email) return;
      form.querySelector("button")?.setAttribute("disabled", "disabled");
      if (messageNode) messageNode.textContent = "";
      const result = await signInWithEmail(email);
      form.querySelector("button")?.removeAttribute("disabled");
      if (messageNode) {
        messageNode.textContent = result.ok
          ? "הקישור נשלח. אפשר להשאיר את העמוד פתוח ולחזור אחרי האישור במייל."
          : result.error || "לא הצלחנו לשלוח קישור כרגע.";
        messageNode.classList.toggle("error", !result.ok);
      }
    });
  }

  async function signInWithEmail(email) {
    if (!client) return { ok: false, error: "הכניסה עדיין לא מחוברת." };
    const redirectTo = location.href.split("#")[0];
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) {
      setState({ status: "signed-out", error: error.message });
      return { ok: false, error: error.message };
    }
    setState({ status: "link-sent", error: null });
    return { ok: true };
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
      setState({ status: "error", error: "Supabase לא נטען." });
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
      setState({ status: "error", error: error.message, session: null, user: null });
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
