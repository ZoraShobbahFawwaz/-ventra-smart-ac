import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { apiHeaders, apiUrl } from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirm) {
      alert("Password tidak sama ❌");
      return;
    }

    try {
      await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: apiHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name,
          email,
          password,
          role: "laboran",
        }),
      });

      alert("Register berhasil ✅");
      navigate("/");
    } catch {
      alert("Register gagal ❌");
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form" style={containerStyle}>
        {/* TITLE */}
        <h1 style={titleStyle}>Register</h1>

        {/* NAME */}
        <label style={labelStyle}>Name</label>
        <input
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        {/* EMAIL */}
        <label style={labelStyle}>Email Address</label>
        <input
          placeholder="Enter your email address"
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {/* PASSWORD */}
        <label style={labelStyle}>Password</label>
        <div style={inputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
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

        {/* CONFIRM PASSWORD */}
        <label style={labelStyle}>Confirm Password</label>
        <div style={inputWrapper}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Enter your password"
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

        {/* BUTTON */}
        <button onClick={handleRegister} style={buttonStyle}>
          Register
        </button>

        {/* LOGIN */}
        <p style={footerText}>
          Already have an account?{" "}
          <span onClick={() => navigate("/")} style={loginLink}>
            Login
          </span>
        </p>
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
  marginBottom: 30,
  color: "#111",
  textShadow: "0px 4px 10px rgba(0,0,0,0.2)",
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
  marginTop: 10,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0px 10px 25px rgba(45,140,255,0.4)",
};

const footerText = {
  textAlign: "center",
  marginTop: 20,
  fontSize: 12,
  color: "#666",
};

const loginLink = {
  color: "#2d8cff",
  cursor: "pointer",
  fontWeight: 600,
};

export default Register;
