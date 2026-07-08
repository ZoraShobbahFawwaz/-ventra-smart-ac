import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function AuthLayout({ children }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div
      className="auth-layout"
      style={{
        display: "flex",
        position: "relative",
        height: "100vh",
        background: "var(--bg-main)",
        color: "var(--text-main)",
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      <button
        type="button"
        className="header-icon-button"
        style={themeToggleButton}
        aria-label={isDarkMode ? "Aktifkan light mode" : "Aktifkan dark mode"}
        title={isDarkMode ? "Light Mode" : "Dark Mode"}
        onClick={toggleTheme}
      >
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </button>

      {/* LEFT IMAGE */}
      <div
        className="auth-visual"
        style={{
          flex: 1,
          backgroundImage: "url('/ac.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* RIGHT CONTENT */}
      <div
        className="auth-panel"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-main)",
          transition: "background 0.2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const themeToggleButton = {
  position: "absolute",
  top: 18,
  right: 18,
  zIndex: 5,
  width: 38,
  height: 38,
  border: "1px solid var(--header-action-border)",
  borderRadius: 12,
  background: "var(--header-action-bg)",
  color: "var(--text-main)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  padding: 0,
  transition:
    "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
};

export default AuthLayout;
