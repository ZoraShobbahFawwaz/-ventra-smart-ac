import { FaBell, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiHeaders, apiUrl } from "../services/api";

export default function MainLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "-";
  const displayStatus = user?.status || "active";
  const displayRole = user?.role || localStorage.getItem("role") || "-";

  const formattedRole =
    displayRole === "Admin"
      ? "Admin"
      : displayRole === "dosen"
      ? "Dosen"
      : displayRole;

  const formattedStatus =
    String(displayStatus).toLowerCase() === "active" ? "Active" : displayStatus;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
      });
    } catch (err) {
      console.error("Gagal mencatat logout:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    localStorage.removeItem("theme");
    root.dataset.theme = "dark";
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
    document.body.style.background = "#0f172a";
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="main-layout" style={layout}>
      <div className="main-header" style={header}>
        <div>
          <h2 style={titleStyle}>{title}</h2>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>

        <div className="main-header-actions" style={headerRight}>
          <span
            className="header-icon-button"
            style={iconButton}
            aria-label="Notifikasi"
            role="img"
          >
            <FaBell />
          </span>

          <div ref={profileRef} style={profileWrapper}>
            <button
              type="button"
              className="header-profile"
              style={profile}
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
            >
              <div style={avatar} aria-label="Default profile avatar" role="img">
                <FaUserCircle />
              </div>

              <div style={profileText}>
                <div style={profileName}>{displayName}</div>
                <div style={profileRole}>{formattedRole}</div>
              </div>
            </button>

            {isProfileOpen && (
              <div style={profileDropdown} role="menu">
                <div style={dropdownHeader}>
                  <div style={dropdownAvatar}>
                    <FaUserCircle />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={dropdownName}>{displayName}</div>
                    <div style={dropdownEmail}>{displayEmail}</div>
                  </div>
                </div>

                <div style={dropdownDivider} />

                <InfoRow label="Role" value={formattedRole} />
                <InfoRow label="Email" value={displayEmail} />
                <InfoRow label="Status" value={formattedStatus} valueStyle={statusBadge} />

                <button
                  type="button"
                  className="profile-logout-button"
                  style={logoutButton}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  );
}

const InfoRow = ({ label, value, valueStyle }) => (
  <div style={infoRow}>
    <span style={infoLabel}>{label}</span>
    <span style={{ ...infoValue, ...valueStyle }}>{value}</span>
  </div>
);

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

const profileWrapper = {
  position: "relative",
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
  cursor: "pointer",
  color: "var(--text-main)",
  transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
};

const avatar = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: "linear-gradient(145deg, rgba(45, 140, 255, 0.22), rgba(15, 23, 42, 0.45))",
  border: "1px solid var(--border-color)",
  color: "#93c5fd",
  fontSize: 34,
  overflow: "hidden",
};

const profileText = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 42,
  lineHeight: 1.15,
  textAlign: "left",
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

const profileDropdown = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 12px)",
  width: 290,
  background: "linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))",
  border: "1px solid rgba(96, 165, 250, 0.24)",
  borderRadius: 16,
  boxShadow: "0 22px 60px rgba(2, 8, 23, 0.42)",
  padding: 14,
  zIndex: 50,
};

const dropdownHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const dropdownAvatar = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  background: "rgba(45, 140, 255, 0.16)",
  border: "1px solid rgba(96, 165, 250, 0.28)",
  color: "#93c5fd",
  fontSize: 36,
};

const dropdownName = {
  color: "#f8fafc",
  fontWeight: 800,
  fontSize: 15,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dropdownEmail = {
  color: "#cbd5e1",
  fontSize: 12,
  marginTop: 3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dropdownDivider = {
  height: 1,
  background: "rgba(148, 163, 184, 0.18)",
  margin: "12px 0",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  padding: "8px 0",
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
};

const infoValue = {
  color: "#f8fafc",
  fontSize: 12,
  fontWeight: 700,
  textAlign: "right",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const statusBadge = {
  color: "#4ade80",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  borderRadius: 999,
  padding: "4px 9px",
};

const logoutButton = {
  width: "100%",
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: 12,
  color: "#fca5a5",
  cursor: "pointer",
  padding: "10px 12px",
  fontWeight: 800,
  transition: "0.18s ease",
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
