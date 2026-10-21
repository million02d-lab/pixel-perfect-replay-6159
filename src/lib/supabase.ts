type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type AuthSession = { access_token: string; refresh_token: string; expires_at: number; token_type?: string; user?: AuthUser };
const SESSION_KEY = "ozannif.auth.session";
const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "https://sqqbfvuvtmuapnxifmeq.supabase.co";
// Publishable keys are intended for browser use; database access is still protected by RLS.
const SUPABASE_KEY = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ?? "sb_publishable_HyUlm9-0KYg2fKKUnb--Hw_RK2VldIe";

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
  const accessToken = value["access_token"];
  const refreshToken = value["refresh_token"];
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") return null;
  const rawExpiresIn = value["expires_in"];
  const expiresIn = typeof rawExpiresIn === "number" ? rawExpiresIn : 3600;
  const rawUser = value["user"];
  const user = typeof rawUser === "object" && rawUser !== null ? rawUser as AuthUser : null;
  const rawTokenType = value["token_type"];
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: typeof rawTokenType === "string" ? rawTokenType : "bearer",
    ...(user ? { user } : {}),
  };
}
async function authRequest(path: string, body?: unknown, token?: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload["msg"] === "string" ? payload["msg"] : typeof payload["message"] === "string" ? payload["message"] : typeof payload["error_description"] === "string" ? payload["error_description"] : "The account request could not be completed.");
  return payload as Record<string, unknown>;
}
export async function signUp(email: string, password: string, fullName: string, accountType: "passenger" | "driver" = "passenger") {
  const result = await authRequest("signup", { email, password, data: { full_name: fullName, account_type: accountType } });
  const session = normalizeSession(result);
  if (session) writeSession(session); else writeSession(null);
  return { session, user: result["user"] as AuthUser | undefined };
}
export async function requestPasswordReset(email: string) {
  const redirect = typeof window === "undefined" ? undefined : `${window.location.origin}/signin`;
  const path = redirect ? `recover?redirect_to=${encodeURIComponent(redirect)}` : "recover";
  await authRequest(path, { email });
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
  if (!response.ok) throw new Error(typeof payload["error"] === "string" ? payload["error"] : "The request could not be completed.");
  return payload as T;
}

 
export type DriverDocumentType = "identity" | "driving_license" | "vehicle_registration" | "insurance";
export async function uploadDriverDocument(file: File, docType: DriverDocumentType) {
  const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) throw new Error("Use a PDF, JPG or PNG image.");
  if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new Error("Each document must be smaller than 10 MB.");
  const { url, key } = config();
  const token = await getAccessToken();
  let userId = readSession()?.user?.id;
  if (!userId) {
    const current = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    const currentUser = await current.json().catch(() => ({}));
    if (!current.ok || typeof currentUser.id !== "string") throw new Error("Please sign in again before uploading documents.");
    userId = currentUser.id;
  }
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const storagePath = `${userId}/${docType}/${crypto.randomUUID()}.${ext}`;
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const uploaded = await fetch(`${url}/storage/v1/object/driver-documents/${encodedPath}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": file.type, "x-upsert": "false" },
    body: file,
  });
  if (!uploaded.ok) {
    const payload = await uploaded.json().catch(() => ({}));
    throw new Error(typeof payload.message === "string" ? payload.message : "Document upload failed. Check your driver application status.");
  }
  const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 180) || `document.${ext}`;
  try {
    await invokeOzannif({ action: "register-document", docType, storagePath, originalFilename: safeName, mimeType: file.type, fileSizeBytes: file.size });
  } catch (error) {
    try {
      await fetch(`${url}/storage/v1/object/driver-documents/${encodedPath}`, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${token}` },
      });
    } catch { /* Keep any cleanup failure private; the object remains in a private bucket. */ }
    throw error;
  }
}
