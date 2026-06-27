import { FaMoon, FaSun, FaBell } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function MainLayout({ children, title, subtitle }) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const displayName = user?.name || "User";
  const displayRole = user?.role || localStorage.getItem("role") || "-";

  const formattedRole =
    displayRole === "Admin"
      ? "Admin"
      : displayRole === "laboran"
      ? "Laboran"
      : displayRole;

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    const root = document.documentElement;

    if (darkMode) {
      root.style.setProperty("--bg-main", "#0f172a");
      root.style.setProperty("--bg-sidebar", "#111827");
      root.style.setProperty("--bg-card", "#1e293b");
      root.style.setProperty("--bg-card-soft", "#273449");
      root.style.setProperty("--text-main", "#f8fafc");
      root.style.setProperty("--text-muted", "#cbd5e1");
      root.style.setProperty("--border-color", "#334155");
      root.style.setProperty("--input-bg", "#1e293b");
      root.style.setProperty("--shadow-color", "rgba(0,0,0,0.25)");
    } else {
      root.style.setProperty("--bg-main", "#f5f6f8");
      root.style.setProperty("--bg-sidebar", "#ffffff");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--bg-card-soft", "#f8fafc");
      root.style.setProperty("--text-main", "#111111");
      root.style.setProperty("--text-muted", "#666666");
      root.style.setProperty("--border-color", "#eeeeee");
      root.style.setProperty("--input-bg", "#ffffff");
      root.style.setProperty("--shadow-color", "rgba(0,0,0,0.05)");
    }

    document.body.style.background = darkMode ? "#0f172a" : "#f5f6f8";
  }, [darkMode]);

  return (
    <div className="main-layout" style={layout}>
      <div className="main-header" style={header}>
        <div>
          <h2 style={titleStyle}>{title}</h2>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>

        <div className="main-header-actions" style={headerRight}>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            style={iconButton}
            aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          <span style={iconButton} aria-label="Notifikasi" role="img">
            <FaBell />
          </span>

          <div style={profile}>
            <img
              src={`https://i.pravatar.cc/40?u=${displayName}`}
              style={avatar}
              alt="profile"
            />

            <div style={profileText}>
              <div style={profileName}>{displayName}</div>
              <div style={profileRole}>{formattedRole}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  );
}

const layout = {
  flex: 1,
  padding: 20,
  background: "var(--bg-main)",
  color: "var(--text-main)",
  minHeight: "100vh",
  transition: "0.2s ease",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle = {
  margin: 0,
  color: "var(--text-main)",
};

const subtitleStyle = {
  margin: 0,
  fontSize: 12,
  color: "var(--text-muted)",
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: 44,
};

const profile = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: 44,
  paddingLeft: 2,
};

const avatar = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "block",
  flexShrink: 0,
  objectFit: "cover",
};

const profileText = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 42,
  lineHeight: 1.15,
};

const profileName = {
  fontWeight: 700,
  fontSize: 15,
  color: "var(--text-main)",
  whiteSpace: "nowrap",
};

const profileRole = {
  fontSize: 12,
  color: "var(--text-muted)",
  marginTop: 3,
  whiteSpace: "nowrap",
};

const iconButton = {
  width: 34,
  height: 34,
  border: "none",
  borderRadius: 10,
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 16,
  color: "var(--text-main)",
  lineHeight: 1,
  padding: 0,
};
