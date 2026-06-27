import {
  FaClipboardList,
  FaDoorOpen,
  FaHome,
  FaSignOutAlt,
  FaUsers,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { apiHeaders, apiUrl } from "../services/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const roleUser = localStorage.getItem("role");

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

  return (
    <div className="app-sidebar" style={sidebarStyle}>
      <div style={sidebarInner}>
        <div>
          <h2 style={brandStyle}>Ventra</h2>

          <MenuItem
            icon={<FaHome />}
            label="Dashboard"
            active={location.pathname === "/dashboard"}
            onClick={() => navigate("/dashboard")}
          />

          <MenuItem
            icon={<FaDoorOpen />}
            label="Kelola Ruangan"
            active={location.pathname === "/kelola-ruangan"}
            onClick={() => navigate("/kelola-ruangan")}
          />

          {roleUser === "Admin" && (
            <>
              <MenuItem
                icon={<FaClipboardList />}
                label="Audit Logs"
                active={location.pathname === "/audit-logs"}
                onClick={() => navigate("/audit-logs")}
              />

              <MenuItem
                icon={<FaUsers />}
                label="User"
                active={location.pathname === "/user"}
                onClick={() => navigate("/user")}
              />
            </>
          )}
        </div>

        <div style={{ marginTop: "auto", paddingBottom: 20 }}>
          <MenuItem
            icon={<FaSignOutAlt />}
            label="Log Out"
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}

const MenuItem = ({ icon, label, active, onClick }) => (
  <div
    className={`sidebar-menu-item${active ? " sidebar-menu-item-active" : ""}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 10,
      background: active
        ? "linear-gradient(90deg, #2d8cff, #1a6ed8)"
        : "transparent",
      color: active ? "#fff" : "var(--text-main, #111)",
      cursor: "pointer",
      marginBottom: 10,
      transition:
        "background 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
    }}
  >
    <span className="sidebar-menu-icon">{icon}</span>
    <span>{label}</span>
  </div>
);

const sidebarStyle = {
  width: 220,
  background: "var(--bg-sidebar, #fff)",
  padding: "20px 20px 0 20px",
  borderRight: "1px solid var(--border-color, #eee)",
  minHeight: "100vh",
  transition: "0.2s ease",
};

const sidebarInner = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const brandStyle = {
  marginBottom: 30,
  color: "var(--text-main, #111)",
};
