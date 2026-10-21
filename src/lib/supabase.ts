type AuthSession = { access_token: string; refresh_token: string; expires_at: number; token_type?: string; user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } };
const SESSION_KEY = "ozannif.auth.session";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Ozannif account services are not configured yet.");
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_KEY };
}
function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session.access_token && session.refresh_token ? session : null;
  } catch { return null; }
}
function writeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) window.sessionStorage.removeItem(SESSION_KEY);
  else window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function normalizeSession(value: Record<string, unknown>): AuthSession | null {
  if (typeof value.access_token !== "string" || typeof value.refresh_token !== "string") return null;
  const expiresIn = typeof value.expires_in === "number" ? value.expires_in : 3600;
  return { access_token: value.access_token, refresh_token: value.refresh_token, expires_at: Math.floor(Date.now() / 1000) + expiresIn, token_type: typeof value.token_type === "string" ? value.token_type : "bearer", user: typeof value.user === "object" && value.user ? value.user as AuthSession["user"] : undefined };
}
async function authRequest(path: string, body?: unknown, token?: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.msg === "string" ? payload.msg : typeof payload.message === "string" ? payload.message : typeof payload.error_description === "string" ? payload.error_description : "The account request could not be completed.");
  return payload as Record<string, unknown>;
}
export async function signUp(email: string, password: string, fullName: string, accountType: "passenger" | "driver" = "passenger") {
  const result = await authRequest("signup", { email, password, data: { full_name: fullName, account_type: accountType } });
  const session = normalizeSession(result);
  if (session) writeSession(session);
  return { session, user: result.user as { id?: string; email?: string; user_metadata?: Record<string, unknown> } | undefined };
}
export async function signIn(email: string, password: string) {
  const result = await authRequest("token?grant_type=password", { email, password });
  const session = normalizeSession(result);
  if (!session) throw new Error("Sign-in did not return an active session. Check your email confirmation settings.");
  writeSession(session);
  return session;
}
export async function signOut() {
  const session = readSession();
  if (session) {
    try { await authRequest("logout", undefined, session.access_token); }
    finally { writeSession(null); }
  } else writeSession(null);
}
export async function getAccessToken(): Promise<string> {
  const session = readSession();
  if (!session) throw new Error("Please sign in to continue.");
  if (session.expires_at > Math.floor(Date.now() / 1000) + 45) return session.access_token;
  const result = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
  const refreshed = normalizeSession(result);
  if (!refreshed) { writeSession(null); throw new Error("Your session expired. Please sign in again."); }
  writeSession(refreshed);
  return refreshed.access_token;
}
export async function invokeOzannif<T = Record<string, unknown>>(body: Record<string, unknown>, options: { idempotencyKey?: string; anonymous?: boolean } = {}): Promise<T> {
  const { url, key } = config();
  const token = options.anonymous ? null : await getAccessToken();
  const response = await fetch(`${url}/functions/v1/ozannif-api`, {
    method: "POST",
    headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}) },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The request could not be completed.");
  return payload as T;
}
