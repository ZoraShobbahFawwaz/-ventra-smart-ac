import React, { useEffect, useState } from "react";
import {
  FaCheck,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import Sidebar from "../components/Sidebar";
import { apiHeaders, apiUrl } from "../services/api";

function User() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl("/users"), {
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
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
      setUsers(
        data.sort((a, b) => {
          const statusA = a.status || "active";
          const statusB = b.status || "active";

          if (statusA === statusB) return b.id - a.id;
          return statusA === "pending" ? -1 : 1;
        })
      );
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
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
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

  const handleApprove = async (id) => {
    if (!window.confirm("Setujui akun user ini?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl(`/users/${id}/approve`), {
        method: "PATCH",
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Gagal menyetujui user");
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error("Gagal approve user:", err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      (u.status || "active").toLowerCase().includes(search.toLowerCase())
  );

  const activeUsers = users.filter((u) => (u.status || "active") === "active");
  const pendingUsers = users.filter((u) => u.status === "pending");
  const totalUser = activeUsers.length;
  const totalAdmin = activeUsers.filter((u) => u.role === "Admin").length;
  const totalDosen = activeUsers.filter((u) => u.role === "dosen").length;
  const totalPending = pendingUsers.length;

  return (
    <div className="app-shell" style={layoutStyle}>
      <Sidebar />

      {/* MAIN */}
      <MainLayout
        title="User Management"
        subtitle="Kelola user dan akses sistem"
      >
        {/* CARDS */}
        <div className="stat-grid" style={cardWrapper}>
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
            title="DOSEN"
            value={totalDosen}
            subtitle="User pengelola ruang kelas"
          />
          <Card
            title="PENDING"
            value={totalPending}
            subtitle="Menunggu approval admin"
          />
        </div>

        {/* SEARCH */}
        <div className="toolbar-row" style={searchWrapper}>
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
        <div className="table-scroll" style={tableContainer}>
          <div className="table-grid user-table-grid table-header-row" style={tableHeader}>
            <div>Nama</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredUsers.map((u) => (
            <div key={u.id} className="table-grid user-table-grid table-data-row" style={tableRow}>
              <div>{u.name}</div>
              <div>{u.email}</div>
              <div>{u.role}</div>
              <div>
                <span
                  style={
                    (u.status || "active") === "pending"
                      ? pendingBadge
                      : activeBadge
                  }
                >
                  {(u.status || "active") === "pending"
                    ? "Pending"
                    : "Active"}
                </span>
              </div>

              <div style={actions}>
                {(u.status || "active") === "pending" && (
                  <button
                    className="icon-action-button icon-action-approve"
                    style={approveBtn}
                    onClick={() => handleApprove(u.id)}
                    title="Approve user"
                  >
                    <FaCheck />
                  </button>
                )}
                <button
                  className="icon-action-button icon-action-danger"
                  style={iconBtn}
                  onClick={() => handleDelete(u.id)}
                >
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
  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
  padding: 15,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontWeight: 600,
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
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

const approveBtn = {
  ...iconBtn,
  color: "#22c55e",
  border: "1px solid rgba(34, 197, 94, 0.35)",
  background: "rgba(34, 197, 94, 0.12)",
};

const activeBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "6px 12px",
  color: "#22c55e",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  fontSize: 12,
  fontWeight: 700,
};

const pendingBadge = {
  ...activeBadge,
  color: "#facc15",
  background: "rgba(250, 204, 21, 0.12)",
  border: "1px solid rgba(250, 204, 21, 0.28)",
};

const emptyRow = {
  padding: 15,
  color: "var(--text-muted, #666)",
  fontSize: 14,
};

export default User;
