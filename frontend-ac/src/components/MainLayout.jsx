import { FaMoon, FaSun, FaBell } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function MainLayout({ children, title, subtitle }) {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") !== "light"
  );

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const displayName = user?.name || "User";
  const displayRole = user?.role || localStorage.getItem("role") || "-";

  const formattedRole =
    displayRole === "Admin"
      ? "Admin"
      : displayRole === "dosen"
      ? "Dosen"
      : displayRole;

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    const root = document.documentElement;
    root.dataset.theme = darkMode ? "dark" : "light";

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
      root.style.setProperty("--header-action-bg", "transparent");
      root.style.setProperty("--header-action-border", "transparent");
      root.style.setProperty("--header-action-hover-bg", "rgba(45,140,255,0.12)");
      root.style.setProperty("--header-action-hover-border", "rgba(96,165,250,0.28)");
      root.style.setProperty("--profile-bg", "transparent");
      root.style.setProperty("--profile-border", "transparent");
      root.style.setProperty("--profile-shadow", "none");
    } else {
      root.style.setProperty("--bg-main", "linear-gradient(180deg, #e8eef7 0%, #dfe8f3 100%)");
      root.style.setProperty("--bg-sidebar", "linear-gradient(180deg, #f8fbff 0%, #edf4fb 100%)");
      root.style.setProperty("--bg-card", "#f8fbff");
      root.style.setProperty("--bg-card-soft", "#edf4fb");
      root.style.setProperty("--text-main", "#102033");
      root.style.setProperty("--text-muted", "#52667f");
      root.style.setProperty("--border-color", "#c8d6e6");
      root.style.setProperty("--input-bg", "#f8fbff");
      root.style.setProperty("--shadow-color", "rgba(30, 64, 105, 0.09)");
      root.style.setProperty("--header-action-bg", "#f8fbff");
      root.style.setProperty("--header-action-border", "#c8d6e6");
      root.style.setProperty("--header-action-hover-bg", "#e6f0fb");
      root.style.setProperty("--header-action-hover-border", "#93c5fd");
      root.style.setProperty("--profile-bg", "rgba(248,251,255,0.82)");
      root.style.setProperty("--profile-border", "#c8d6e6");
      root.style.setProperty("--profile-shadow", "0 10px 24px rgba(30,64,105,0.08)");
    }

    document.body.style.background = darkMode ? "#0f172a" : "#dfe8f3";
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
            className="header-icon-button"
            onClick={() => setDarkMode(!darkMode)}
            style={iconButton}
            aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          <span
            className="header-icon-button"
            style={iconButton}
            aria-label="Notifikasi"
            role="img"
          >
            <FaBell />
          </span>

          <div className="header-profile" style={profile}>
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
  padding: "4px 8px 4px 4px",
  borderRadius: 999,
  background: "var(--profile-bg)",
  border: "1px solid var(--profile-border)",
  boxShadow: "var(--profile-shadow)",
  transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
};

const avatar = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "block",
  flexShrink: 0,
  objectFit: "cover",
  border: "1px solid var(--border-color)",
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
  border: "1px solid var(--header-action-border)",
  borderRadius: 10,
  background: "var(--header-action-bg)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 16,
  color: "var(--text-main)",
  lineHeight: 1,
  padding: 0,
  transition:
    "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
};
