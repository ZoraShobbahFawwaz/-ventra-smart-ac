import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 🔥 TAMBAH INI
import AuthLayout from "../components/AuthLayout";
import { apiUrl } from "../services/api";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate(); // 🔥 TAMBAH INI

  const handleReset = async () => {
    if (!email) {
      alert("Email wajib diisi ⚠️");
      return;
    }

    try {
      const res = await fetch(apiUrl("/auth/request-reset"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal mengirim request ❌");
        return;
      }

      // 🔥 AMBIL TOKEN DARI BACKEND
      const token = data.token;

      if (!token) {
        alert("Token tidak ditemukan ❌");
        return;
      }

      // 🔥 LANGSUNG PINDAH HALAMAN
      navigate(`/new-password?token=${token}`);

    } catch {
      alert("Server error ❌");
    }
  };

  return (
    <AuthLayout>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Reset Password</h1>

        <p style={subtitleStyle}>
          Recover your account password
        </p>

        <label style={labelStyle}>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleReset} style={buttonStyle}>
          Send
        </button>
      </div>
    </AuthLayout>
  );
}

/* ================= STYLE ================= */

const containerStyle = { width: 400 };

const titleStyle = {
  fontSize: 36,
  fontWeight: 800,
  marginBottom: 10,
  color: "#111",
  textShadow: "0px 4px 10px rgba(0,0,0,0.2)",
};

const subtitleStyle = {
  fontSize: 13,
  color: "#666",
  marginBottom: 30,
};

const labelStyle = {
  fontSize: 13,
  marginBottom: 5,
  display: "block",
  color: "#555",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: 20,
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#f9f9f9",
  outline: "none",
  fontSize: 14,
};

const buttonStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 30,
  border: "none",
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0px 10px 25px rgba(45,140,255,0.4)",
};

export default ResetPassword;
