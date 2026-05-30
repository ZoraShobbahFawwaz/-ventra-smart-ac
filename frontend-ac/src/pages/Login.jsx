import { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password wajib diisi ⚠️");
      return;
    }

    try {
      setError("");

      const data = await login(email, password);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch {
      setError("Email atau password salah ❌");
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form" style={{ width: 380 }}>
        <h1
          style={{
            fontSize: 33,
            fontWeight: 800,
            marginBottom: 10,
            color: "#111",
          }}
        >
          Welcome to Smart AC Management System
        </h1>

        <p
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 30,
          }}
        >
          Monitor and control laboratory air conditioning automatically based on
          real-time room conditions and schedules.
        </p>

        <label style={{ fontSize: 14 }}>Email</label>
        <input
          type="email"
          placeholder="Enter Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.border = "1px solid #2d8cff")}
          onBlur={(e) => (e.target.style.border = "1px solid #e0e0e0")}
        />

        <label style={{ fontSize: 14, marginTop: 15, display: "block" }}>
          Password
        </label>

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.target.style.border = "1px solid #2d8cff")}
            onBlur={(e) => (e.target.style.border = "1px solid #e0e0e0")}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2d8cff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: 18,
              color: "#888",
            }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {error && (
          <p
            style={{
              color: "red",
              fontSize: 12,
              marginTop: 10,
            }}
          >
            {error}
          </p>
        )}

        <p
          onClick={() => navigate("/reset-password")}
          onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          style={{
            textAlign: "right",
            fontSize: 12,
            fontWeight: 600,
            color: "#2d8cff",
            cursor: "pointer",
            marginTop: 5,
          }}
        >
          Forgot Password?
        </p>

        <button onClick={handleLogin} style={buttonStyle}>
          Login
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12 }}>
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ color: "#2d8cff", cursor: "pointer", fontWeight: 600 }}
          >
            Register
          </span>
        </p>
      </div>
    </AuthLayout>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 45px 14px 14px",
  marginTop: 8,
  borderRadius: 10,
  border: "1px solid #e0e0e0",
  outline: "none",
  fontSize: 14,
  transition: "0.2s",
};

const buttonStyle = {
  width: "100%",
  marginTop: 20,
  padding: 14,
  borderRadius: 30,
  border: "none",
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "white",
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0px 8px 20px rgba(45,140,255,0.3)",
};

export default Login;
