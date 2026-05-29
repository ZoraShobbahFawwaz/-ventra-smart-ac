import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { apiUrl } from "../services/api";

function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const handleSubmit = async () => {
    if (!password || !confirm) {
      alert("Semua field wajib diisi ⚠️");
      return;
    }

    if (password !== confirm) {
      alert("Password tidak sama ❌");
      return;
    }

    if (!token) {
      alert("Token tidak ditemukan ❌");
      return;
    }

    try {
      const res = await fetch(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      // ✅ HANDLE ERROR DARI BACKEND
      if (!res.ok) {
        alert(data.message || "Gagal update password ❌");
        return;
      }

      alert(data.message || "Password berhasil diubah ✅");

      navigate("/");

    } catch {
      alert("Server error ❌");
    }
  };

  return (
    <AuthLayout>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Create New Password</h1>

        <p style={subtitleStyle}>
          Enter your new password
        </p>

        <label style={labelStyle}>Password</label>
        <div style={inputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={iconStyle}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <label style={labelStyle}>Confirm Password</label>
        <div style={inputWrapper}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Enter Your Password"
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle}
          />
          <span
            onClick={() => setShowConfirm(!showConfirm)}
            style={iconStyle}
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button onClick={handleSubmit} style={buttonStyle}>
          Submit
        </button>
      </div>
    </AuthLayout>
  );
}

/* ================= STYLE ================= */

const containerStyle = {
  width: 400,
};

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

const inputWrapper = {
  position: "relative",
};

const inputStyle = {
  width: "100%",
  padding: "14px 45px 14px 16px",
  marginBottom: 18,
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#f9f9f9",
  outline: "none",
  fontSize: 14,
};

const iconStyle = {
  position: "absolute",
  right: 15,
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: "#777",
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

export default NewPassword;
