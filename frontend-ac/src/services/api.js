export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export function apiUrl(path) {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiHeaders(headers = {}) {
  return {
    "ngrok-skip-browser-warning": "true",
    ...headers,
  };
}

// ================= LOGIN =================
export async function login(email, password) {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: apiHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Login gagal");

  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.user.role);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

// ================= REGISTER =================
export async function register(name, email, password) {
  const res = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: apiHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      name,
      email,
      password,
      role: "dosen",
    }),
  });

  if (!res.ok) throw new Error("Register gagal");

  return res.json();
}

// ================= GET TOKEN =================
export function getToken() {
  return localStorage.getItem("token");
}

// ================= GET ROLE =================
export function getRole() {
  return localStorage.getItem("role");
}

// ================= GET USER =================
export function getUser() {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  return JSON.parse(user);
}

// ================= LOGOUT =================
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}

// ================= SEND YOLO =================
// Endpoint ini sengaja tidak pakai token agar program YOLO bisa kirim data langsung
export async function sendYolo(data) {
  const res = await fetch(apiUrl("/detection"), {
    method: "POST",
    headers: apiHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Gagal kirim data YOLO");

  return res.json();
}

// ================= GET LATEST YOLO =================
export async function getLatestYolo() {
  const res = await fetch(apiUrl("/detection/latest"));

  if (!res.ok) throw new Error("Gagal ambil data YOLO terbaru");

  return res.json();
}
