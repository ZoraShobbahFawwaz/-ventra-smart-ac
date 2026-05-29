import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaDoorOpen,
  FaClipboardList,
  FaUsers,
  FaSignOutAlt,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { apiUrl } from "../services/api";

function User() {
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const roleUser = localStorage.getItem("role");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl("/users"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      if (!res.ok) {
        console.error("Gagal ambil data users:", res.status);
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Gagal ambil data users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus user ini?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl(`/users/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      if (!res.ok) {
        alert("Gagal menghapus user");
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error("Gagal hapus user:", err);
    }
  };

  // =========================
  // LOGOUT + AUDIT LOG
  // =========================
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalUser = users.length;
  const totalAdmin = users.filter((u) => u.role === "Admin").length;
  const totalLaboran = users.filter((u) => u.role === "laboran").length;

  return (
    <div style={layoutStyle}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
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

      {/* MAIN */}
      <MainLayout
        title="User Management"
        subtitle="Kelola user dan akses sistem"
      >
        {/* CARDS */}
        <div style={cardWrapper}>
          <Card
            title="TOTAL USER"
            value={totalUser}
            subtitle="Semua user terdaftar"
          />
          <Card
            title="ADMIN"
            value={totalAdmin}
            subtitle="User dengan akses penuh"
          />
          <Card
            title="LABORAN"
            value={totalLaboran}
            subtitle="User operasional lab"
          />
        </div>

        {/* SEARCH */}
        <div style={searchWrapper}>
          <div style={searchStyle}>
            <FaSearch style={{ color: "var(--text-muted, #666)" }} />
            <input
              placeholder="Search..."
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div style={tableContainer}>
          <div style={tableHeader}>
            <div>Nama</div>
            <div>Email</div>
            <div>Role</div>
            <div>Actions</div>
          </div>

          {filteredUsers.map((u) => (
            <div key={u.id} style={tableRow}>
              <div>{u.name}</div>
              <div>{u.email}</div>
              <div>{u.role}</div>

              <div style={actions}>
                <button style={iconBtn} onClick={() => handleDelete(u.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div style={emptyRow}>Tidak ada user ditemukan</div>
          )}
        </div>
      </MainLayout>
    </div>
  );
}

/* COMPONENT */
const MenuItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
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
      transition: "0.2s ease",
    }}
  >
    {icon}
    {label}
  </div>
);

const Card = ({ title, value, subtitle }) => (
  <div style={cardStyle}>
    <div style={cardTitle}>{title}</div>
    <h2 style={cardValue}>{value}</h2>
    <div style={cardSubtitle}>{subtitle}</div>
  </div>
);

/* STYLE */
const layoutStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--bg-main, #f5f6f8)",
  fontFamily: "sans-serif",
  transition: "0.2s ease",
};

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

const cardWrapper = {
  display: "flex",
  gap: 20,
};

const cardStyle = {
  flex: 1,
  background: "var(--bg-card, #fff)",
  color: "var(--text-main, #111)",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0px 5px 15px var(--shadow-color, rgba(0,0,0,0.05))",
  border: "1px solid var(--border-color, #eee)",
  transition: "0.2s ease",
};

const cardTitle = {
  fontSize: 12,
  color: "var(--text-muted, #666)",
};

const cardValue = {
  margin: "10px 0",
  color: "var(--text-main, #111)",
};

const cardSubtitle = {
  fontSize: 12,
  color: "var(--text-muted, #999)",
};

const searchWrapper = {
  display: "flex",
  marginTop: 20,
  gap: 10,
};

const searchStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "var(--input-bg, #fff)",
  color: "var(--text-main, #111)",
  padding: "10px 15px",
  borderRadius: 10,
  border: "1px solid var(--border-color, #eee)",
  transition: "0.2s ease",
};

const inputStyle = {
  border: "none",
  outline: "none",
  flex: 1,
  background: "transparent",
  color: "var(--text-main, #111)",
};

const tableContainer = {
  marginTop: 20,
  background: "var(--bg-card, #fff)",
  color: "var(--text-main, #111)",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid var(--border-color, #eee)",
  transition: "0.2s ease",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 2fr 1fr 1fr",
  padding: 15,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontWeight: 600,
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 2fr 1fr 1fr",
  padding: 15,
  borderBottom: "1px solid var(--border-color, #eee)",
  color: "var(--text-main, #111)",
};

const actions = {
  display: "flex",
  gap: 10,
};

const iconBtn = {
  border: "1px solid var(--border-color, #ddd)",
  borderRadius: "50%",
  padding: 8,
  background: "var(--input-bg, #fff)",
  color: "var(--text-main, #111)",
  cursor: "pointer",
  transition: "0.2s ease",
};

const emptyRow = {
  padding: 15,
  color: "var(--text-muted, #666)",
  fontSize: 14,
};

export default User;
