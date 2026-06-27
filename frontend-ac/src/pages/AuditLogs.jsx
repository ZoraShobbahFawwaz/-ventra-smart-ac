import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import Sidebar from "../components/Sidebar";
import { apiHeaders, apiUrl } from "../services/api";

function AuditLogs() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(apiUrl("/audit-logs"), {
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
      });

      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Gagal fetch audit logs:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/");
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // =========================
  // HELPERS
  // =========================
  const safeParse = (value) => {
    if (value === null || value === undefined) return null;

    if (typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const formatValue = (value) => {
    const parsed = safeParse(value);

    if (parsed === null || parsed === undefined) return "-";

    if (typeof parsed === "object") {
      return JSON.stringify(parsed, null, 2);
    }

    return String(parsed);
  };

  const getReasonFromLog = (log) => {
    const newValue = safeParse(log?.new_value);
    const oldValue = safeParse(log?.old_value);

    if (newValue?.reason) return newValue.reason;
    if (newValue?.payload?.reason) return newValue.payload.reason;
    if (newValue?.manual_reason) return newValue.manual_reason;

    if (oldValue?.reason) return oldValue.reason;
    if (oldValue?.payload?.reason) return oldValue.payload.reason;

    const subject = String(log?.subject || "");
    const match = subject.match(/Alasan:\s*(.*)$/i);

    if (match?.[1]) return match[1];

    return "-";
  };

  const getStatusText = (status) => {
    if (!status) return "-";
    return String(status).toLowerCase();
  };

  const getColor = (action) => {
    switch (action?.toLowerCase()) {
      case "create":
        return "#22c55e";
      case "update":
        return "#2d8cff";
      case "delete":
        return "#ef4444";
      case "read":
        return "#f59e0b";
      case "login":
        return "#f59e0b";
      case "logout":
        return "#a855f7";
      default:
        return "var(--text-main, #111)";
    }
  };

  const getStatusStyle = (status) => {
    const currentStatus = getStatusText(status);

    if (currentStatus === "success") {
      return {
        background: "rgba(34, 197, 94, 0.12)",
        color: "#22c55e",
        border: "1px solid rgba(34, 197, 94, 0.35)",
      };
    }

    if (currentStatus === "failed") {
      return {
        background: "rgba(239, 68, 68, 0.12)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.35)",
      };
    }

    return {
      background: "rgba(148, 163, 184, 0.12)",
      color: "var(--text-muted, #666)",
      border: "1px solid rgba(148, 163, 184, 0.35)",
    };
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("id-ID");
  };

  const formatTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleTimeString("id-ID");
  };

  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString("id-ID");
  };

  const searchableText = (log) => {
    const reason = getReasonFromLog(log);

    return [
      log?.user_name,
      log?.action,
      log?.module,
      log?.subject,
      log?.status,
      reason,
      formatValue(log?.old_value),
      formatValue(log?.new_value),
      log?.created_at,
    ]
      .join(" ")
      .toLowerCase();
  };

  const filteredLogs = logs.filter((log) =>
    searchableText(log).includes(search.toLowerCase())
  );

  const totalSuccess = logs.filter(
    (log) => getStatusText(log.status) === "success"
  ).length;

  const totalFailed = logs.filter(
    (log) => getStatusText(log.status) === "failed"
  ).length;

  return (
    <div className="app-shell" style={layoutStyle}>
      <Sidebar />

      {/* MAIN */}
      <MainLayout
        title="Audit Logs"
        subtitle="Pantau riwayat aktivitas pengguna dalam sistem"
      >
        <div className="stat-grid" style={cardWrapper}>
          <Card
            title="TOTAL LOGS"
            value={logs.length}
            subtitle="Semua aktivitas tercatat"
          />
          <Card
            title="SUCCESS"
            value={totalSuccess}
            subtitle="Aktivitas berhasil"
          />
          <Card
            title="FAILED"
            value={totalFailed}
            subtitle="Aktivitas gagal"
          />
        </div>

        {/* SEARCH */}
        <div className="toolbar-row" style={searchWrapper}>
          <div style={searchStyle}>
            <FaSearch style={{ color: "var(--text-muted, #666)" }} />
            <input
              placeholder="Search logs..."
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="action-button action-button-primary"
            style={refreshBtn}
            onClick={fetchLogs}
          >
            Refresh
          </button>
        </div>

        {/* TABLE */}
        <div className="table-scroll" style={tableContainer}>
          <div className="table-grid audit-table-grid table-header-row" style={tableHeader}>
            <div>User</div>
            <div>Action</div>
            <div>Module</div>
            <div>Date & Time</div>
            <div>Subject</div>
            <div>Reason</div>
            <div>Status</div>
            <div>Detail</div>
          </div>

          {filteredLogs.map((log) => {
            const reason = getReasonFromLog(log);

            return (
              <div key={log.id} className="table-grid audit-table-grid table-data-row" style={tableRow}>
                <div>{log.user_name || "-"}</div>

                <div
                  style={{
                    color: getColor(log.action),
                    fontWeight: 600,
                  }}
                >
                  {log.action || "-"}
                </div>

                <div>{log.module || "-"}</div>

                <div>
                  <div>{formatDate(log.created_at)}</div>
                  <div style={time}>{formatTime(log.created_at)}</div>
                </div>

                <div style={subjectCell}>{log.subject || "-"}</div>

                <div style={reasonCell}>{reason}</div>

                <div>
                  <span style={{ ...statusBadge, ...getStatusStyle(log.status) }}>
                    {getStatusText(log.status)}
                  </span>
                </div>

                <div>
                  <button
                    className="action-button action-button-view"
                    style={btn}
                    onClick={() => setSelectedLog(log)}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div style={emptyRow}>Tidak ada audit log ditemukan</div>
          )}
        </div>
      </MainLayout>

      {/* MODAL */}
      {selectedLog && (
        <div style={overlay}>
          <div className="responsive-modal" style={modal}>
            <div style={modalHeader}>Audit Log Detail</div>

            <div style={modalBody}>
              <DetailRow label="User" value={selectedLog.user_name || "-"} />
              <DetailRow label="Action" value={selectedLog.action || "-"} />
              <DetailRow label="Module" value={selectedLog.module || "-"} />
              <DetailRow label="Subject" value={selectedLog.subject || "-"} />
              <DetailRow label="Reason" value={getReasonFromLog(selectedLog)} />

              <DetailRow
                label="Status"
                value={
                  <span
                    style={{
                      ...statusBadge,
                      ...getStatusStyle(selectedLog.status),
                    }}
                  >
                    {getStatusText(selectedLog.status)}
                  </span>
                }
              />

              <DetailRow
                label="Old Value"
                value={<JsonBlock value={formatValue(selectedLog.old_value)} />}
              />

              <DetailRow
                label="New Value"
                value={<JsonBlock value={formatValue(selectedLog.new_value)} />}
              />

              <DetailRow
                label="Date & Time"
                value={formatDateTime(selectedLog.created_at)}
              />
            </div>

            <div style={modalFooter}>
              <button style={closeBtn} onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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

const DetailRow = ({ label, value }) => (
  <div style={detailRow}>
    <div style={detailLabel}>{label}</div>
    <div style={detailValue}>{value}</div>
  </div>
);

const JsonBlock = ({ value }) => {
  if (!value || value === "-") {
    return <span>-</span>;
  }

  return <pre style={jsonBlock}>{value}</pre>;
};

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

const refreshBtn = {
  background: "#2d8cff",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: 10,
  cursor: "pointer",
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
  gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1.2fr 1.8fr 1.5fr 0.8fr 0.7fr",
  padding: 15,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontWeight: 600,
  gap: 10,
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1.2fr 1.8fr 1.5fr 0.8fr 0.7fr",
  padding: 15,
  borderBottom: "1px solid var(--border-color, #eee)",
  color: "var(--text-main, #111)",
  gap: 10,
  alignItems: "center",
};

const subjectCell = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const reasonCell = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "var(--text-main, #111)",
};

const time = {
  fontSize: 12,
  color: "var(--text-muted, #777)",
};

const btn = {
  background: "#2d8cff",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: 20,
  cursor: "pointer",
};

const emptyRow = {
  padding: 15,
  color: "var(--text-muted, #666)",
  fontSize: 14,
};

const statusBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  textTransform: "capitalize",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modal = {
  width: 680,
  maxWidth: "92vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "var(--bg-card, #fff)",
  color: "var(--text-main, #111)",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid var(--border-color, #eee)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  transition: "0.2s ease",
};

const modalHeader = {
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  textAlign: "center",
  padding: 12,
  fontWeight: 600,
};

const modalBody = {
  padding: 15,
};

const modalFooter = {
  padding: 10,
  display: "flex",
  justifyContent: "flex-end",
  borderTop: "1px solid var(--border-color, #eee)",
};

const detailRow = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 20,
  padding: "10px 0",
  borderBottom: "1px solid var(--border-color, #eee)",
};

const detailLabel = {
  fontWeight: 600,
  color: "var(--text-main, #111)",
};

const detailValue = {
  color: "var(--text-main, #333)",
  wordBreak: "break-word",
  minWidth: 0,
};

const jsonBlock = {
  margin: 0,
  padding: 10,
  background: "var(--bg-card-soft, #f8fafc)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 8,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: 12,
  maxHeight: 220,
  overflowY: "auto",
};

const closeBtn = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid var(--border-color, #ccc)",
  background: "var(--input-bg, #f5f5f5)",
  color: "var(--text-main, #111)",
  cursor: "pointer",
};

export default AuditLogs;
