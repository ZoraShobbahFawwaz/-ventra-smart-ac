import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaDoorOpen,
  FaClipboardList,
  FaUsers,
  FaSignOutAlt,
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { apiUrl } from "../services/api";

export default function KelolaRuangan() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("hari");
  const [roomStatus, setRoomStatus] = useState({});
  const [yoloData, setYoloData] = useState({});
  const [sensorData, setSensorData] = useState({});
  const [controlLoading, setControlLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState("");
  const [controlReason, setControlReason] = useState("");

  const roleUser = localStorage.getItem("role");

  const selectedYoloData = selectedRoom ? yoloData[selectedRoom.name] : null;
  const selectedSensorData = selectedRoom
    ? sensorData[selectedRoom.name]
    : null;
  const selectedRoomIsOn = selectedRoom
    ? roomStatus[selectedRoom.name] === "ON"
    : false;

  // =========================
  // REALTIME DATE
  // =========================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateRealtime = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // =========================
  // FETCH STATUS ROOM
  // =========================
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(apiUrl("/rooms/status"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("HTTP ERROR:", res.status);
          return;
        }

        const data = await res.json();
        setRoomStatus(data);
      } catch (err) {
        console.error("Gagal ambil status:", err);
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // FETCH DATA YOLO REALTIME
  // =========================
  useEffect(() => {
    const fetchYoloData = async () => {
      try {
        const res = await fetch(apiUrl("/detection/latest"));

        if (!res.ok) {
          console.error("Gagal ambil data YOLO:", res.status);
          return;
        }

        const data = await res.json();
        setYoloData(data);
      } catch (err) {
        console.error("Gagal ambil data YOLO:", err);
      }
    };

    fetchYoloData();

    const interval = setInterval(fetchYoloData, 2000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // FETCH DATA SENSOR IOT REALTIME
  // =========================
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const res = await fetch(apiUrl("/mqtt/sensor/latest"));

        if (!res.ok) {
          console.error("Gagal ambil data sensor IoT:", res.status);
          return;
        }

        const data = await res.json();
        setSensorData(data);
      } catch (err) {
        console.error("Gagal ambil data sensor IoT:", err);
      }
    };

    fetchSensorData();

    const interval = setInterval(fetchSensorData, 2000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // FORMAT DATA
  // =========================
  const formatTemperature = (value) => {
    if (!value) return "-";

    if (String(value).toUpperCase() === "OFF") {
      return "OFF";
    }

    return `${value}°C`;
  };

  const formatActualTemperature = (value) => {
    if (value === undefined || value === null) return "-";

    const numberValue = Number(value);

    if (isNaN(numberValue)) return "-";

    return `${numberValue.toFixed(1)}°C`;
  };

  const formatHumidity = (value) => {
    if (value === undefined || value === null) return "-";

    const numberValue = Number(value);

    if (isNaN(numberValue)) return "-";

    return `${numberValue.toFixed(1)}%`;
  };

  const formatOccupancy = (value) => {
    if (value === undefined || value === null) return "-";

    return `${value} Orang`;
  };

  const formatFanSpeed = (value) => {
    if (!value) return "-";

    return value;
  };

  const formatAppliedFanSpeed = (value, isOn) => {
    if (!isOn) return "OFF";

    return formatFanSpeed(value);
  };

  // =========================
  // DATA RUANGAN STATIC
  // =========================
  const data = [
    {
      lantai: "Lantai 1",
      rooms: [
        { name: "Lab. Ergonomic and Innovation Design" },
        { name: "Lab. System and Energy Conversation" },
        { name: "Lab. Robotics and Embedded System" },
        { name: "Lab. Circular Ecosystem and Sustainable Technology" },
      ],
    },
    {
      lantai: "Lantai 2",
      rooms: [
        { name: "Lab. Basic Electronics" },
        { name: "Lab. Telematics and Communication Network" },
        { name: "Lab. Telecommunication and Signal Processing" },
        { name: "Lab. Gait and Motion" },
      ],
    },
    {
      lantai: "Lantai 3",
      rooms: [
        { name: "Lab. Engineering Management" },
        { name: "Lab. Enterprise System" },
        { name: "Lab. Basic Physics and Energy Storage Materials" },
        { name: "Lab. Smart Computing Technology" },
      ],
    },
    {
      lantai: "Lantai 4",
      rooms: [
        { name: "Lab. Cybersecurity & Cloud Computing" },
        { name: "Lab. Software Engineering" },
        { name: "Lab. Application Development" },
        { name: "Lab. Core Programming" },
      ],
    },
    {
      lantai: "Lantai 5",
      rooms: [
        { name: "Lab. Quantitative Modelling For Business and Industry" },
        { name: "Lab. Control and Automation" },
        { name: "Lab. Big Data & Artificial Intelligence" },
        { name: "Lab. Digital Start-Up" },
      ],
    },
  ];

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

  // =========================
  // OPEN REASON MODAL
  // =========================
  const openReasonModal = (command) => {
    if (!selectedRoom) return;

    setPendingCommand(command);
    setControlReason("");
    setReasonModalOpen(true);
  };

  const closeReasonModal = () => {
    if (controlLoading) return;

    setReasonModalOpen(false);
    setPendingCommand("");
    setControlReason("");
  };

  // =========================
  // MANUAL CONTROL AC
  // =========================
  const handleControl = async () => {
    if (!selectedRoom || !pendingCommand) return;

    const reason = controlReason.trim();

    if (!reason) {
      alert("Alasan wajib diisi.");
      return;
    }

    try {
      setControlLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl("/rooms/control"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_name: selectedRoom.name,
          command: pendingCommand,
          reason,
        }),
      });

      if (!res.ok) {
        alert("Gagal mengirim perintah ke AC");
        return;
      }

      const result = await res.json();
      console.log("CONTROL RESPONSE:", result);

      setRoomStatus((prev) => ({
        ...prev,
        [selectedRoom.name]: pendingCommand,
      }));

      setReasonModalOpen(false);
      setPendingCommand("");
      setControlReason("");

      if (pendingCommand === "ON") {
        alert(
          "Perintah ON berhasil dikirim. Alasan sudah dicatat di audit logs.",
        );
      } else {
        alert(
          "Perintah OFF berhasil dikirim. Alasan sudah dicatat di audit logs.",
        );
      }
    } catch (err) {
      console.error("Gagal control AC:", err);
      alert("Terjadi error saat mengontrol AC");
    } finally {
      setControlLoading(false);
    }
  };

  // =========================
  // COMPONENT MENU
  // =========================
  const Menu = ({ icon, label, active, onClick }) => (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 10,
        cursor: "pointer",
        marginBottom: 10,
        background: active
          ? "linear-gradient(90deg, #2d8cff, #1a6ed8)"
          : "transparent",
        color: active ? "#fff" : "var(--text-main, #111)",
        transition: "0.2s ease",
      }}
    >
      {icon}
      {label}
    </div>
  );

  // =========================
  // COMPONENT ROOM CARD
  // =========================
  const RoomCard = ({ room }) => {
    const isOn = roomStatus[room.name] === "ON";

    return (
      <div
        onClick={() => setSelectedRoom(room)}
        style={{
          height: 120,
          borderRadius: 14,
          padding: 15,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          boxShadow: "0 6px 16px var(--shadow-color, rgba(0,0,0,0.05))",
          border: isOn
            ? "2px solid #22c55e"
            : "2px solid var(--border-color, #eee)",
          background: isOn
            ? "rgba(34, 197, 94, 0.14)"
            : "var(--bg-card-soft, #f8fafc)",
          color: "var(--text-main, #111)",
          cursor: "pointer",
          transition: "0.2s ease",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
          {room.name}
        </div>

        <div style={{ display: "flex", gap: 6, fontWeight: 600 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isOn ? "#22c55e" : "var(--text-muted, #888)",
              marginTop: 5,
            }}
          ></span>
          <span style={{ color: isOn ? "#22c55e" : "var(--text-main, #111)" }}>
            {isOn ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={layout}>
      {/* SIDEBAR */}
      <div style={sidebar}>
        <div style={sidebarInner}>
          <div>
            <h2 style={brand}>Ventra</h2>

            <Menu
              icon={<FaHome />}
              label="Dashboard"
              active={location.pathname === "/dashboard"}
              onClick={() => navigate("/dashboard")}
            />

            <Menu
              icon={<FaDoorOpen />}
              label="Kelola Ruangan"
              active={location.pathname === "/kelola-ruangan"}
              onClick={() => navigate("/kelola-ruangan")}
            />

            {roleUser === "Admin" && (
              <>
                <Menu
                  icon={<FaClipboardList />}
                  label="Audit Logs"
                  active={location.pathname === "/audit-logs"}
                  onClick={() => navigate("/audit-logs")}
                />

                <Menu
                  icon={<FaUsers />}
                  label="User"
                  active={location.pathname === "/user"}
                  onClick={() => navigate("/user")}
                />
              </>
            )}
          </div>

          <div style={{ marginTop: "auto", paddingBottom: 20 }}>
            <Menu
              icon={<FaSignOutAlt />}
              label="Log Out"
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <MainLayout
        title="Kelola Ruangan"
        subtitle="Kelola ruang dan status AC secara real-time"
      >
        <div style={container}>
          <div style={titleBar}>Room Mapping</div>

          <div style={{ padding: 20 }}>
            {data.map((floor, i) => (
              <div key={i} style={{ marginBottom: 25 }}>
                <h3 style={floorTitle}>{floor.lantai}</h3>

                <div style={grid}>
                  {floor.rooms.map((room, idx) => (
                    <RoomCard key={idx} room={room} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>

      {/* MODAL */}
      {selectedRoom && (
        <div style={overlay}>
          <div style={modal}>
            {/* CLOSE BUTTON */}
            <button style={closeBtn} onClick={() => setSelectedRoom(null)}>
              ×
            </button>

            {/* MODAL HEADER */}
            <div style={modalTop}>
              <div>
                <h2 style={modalTitle}>{selectedRoom.name}</h2>
                <p style={modalSubtitle}>
                  Detail monitoring dan kontrol manual AC ruangan
                </p>
              </div>

              <div
                style={{
                  ...statusBadge,
                  background:
                    roomStatus[selectedRoom.name] === "ON"
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(148, 163, 184, 0.15)",
                  color:
                    roomStatus[selectedRoom.name] === "ON"
                      ? "#22c55e"
                      : "#e2e8f0",
                  border:
                    roomStatus[selectedRoom.name] === "ON"
                      ? "1px solid #22c55e"
                      : "1px solid rgba(226, 232, 240, 0.35)",
                }}
              >
                ● {roomStatus[selectedRoom.name] === "ON" ? "AC ON" : "AC OFF"}
              </div>
            </div>

            {/* DATA SECTION */}
            <div style={modalGrid}>
              <div style={infoCard}>
                <div style={sectionTitle}>Data Aktual</div>

                <div style={dataRow}>
                  <span>Temperature</span>
                  <b>
                    {formatActualTemperature(selectedSensorData?.temperature)}
                  </b>
                </div>

                <div style={dataRow}>
                  <span>Humidity</span>
                  <b>{formatHumidity(selectedSensorData?.humidity)}</b>
                </div>

                <div style={dataRow}>
                  <span>Occupancy</span>
                  <b>{formatOccupancy(selectedYoloData?.occupancy)}</b>
                </div>

                <div style={{ ...dataRow, borderBottom: "none" }}>
                  <span>Fan Speed</span>
                  <b>
                    {formatAppliedFanSpeed(
                      selectedYoloData?.applied_fan_speed,
                      selectedRoomIsOn,
                    )}
                  </b>
                </div>
              </div>

              <div style={infoCard}>
                <div style={sectionTitle}>Rekomendasi YOLO</div>

                <div style={dataRow}>
                  <span>Temperature</span>
                  <b>{formatTemperature(selectedYoloData?.temperature)}</b>
                </div>

                <div style={dataRow}>
                  <span>Occupancy</span>
                  <b>{formatOccupancy(selectedYoloData?.occupancy)}</b>
                </div>

                <div style={{ ...dataRow, borderBottom: "none" }}>
                  <span>Fan Speed</span>
                  <b>{formatFanSpeed(selectedYoloData?.fan_speed)}</b>
                </div>
              </div>
            </div>

            {/* ENERGY SECTION */}
            <div style={modalGrid}>
              <div style={energyCard}>
                <div style={energyCardHeader}>
                  <div style={energyTitleWrap}>
                    <div style={energyIconBox}>
                      <FaBolt />
                    </div>
                    <div>
                      <div style={energyCardTitle}>Used Energy Today</div>
                      <div style={energyCardSubtitle}>
                        Monitoring energi harian ruangan
                      </div>
                    </div>
                  </div>
                </div>

                <div style={dateTimeWrapper}>
                  <div style={dateTimeCard}>
                    <div style={dateTimeLabel}>
                      <FaCalendarAlt style={{ marginRight: 6 }} />
                      Tanggal
                    </div>
                    <div style={dateTimeValue}>
                      {formatDateRealtime(currentDateTime)}
                    </div>
                  </div>
                </div>

                <div style={miniGrid}>
                  <div style={energyStatCard}>
                    <span style={energyStatLabel}>Daya Saat Ini</span>
                    <b style={energyStatValue}>500 W</b>
                  </div>

                  <div style={energyStatCard}>
                    <span style={energyStatLabel}>Energi Hari Ini</span>
                    <b style={energyStatValue}>15.2 kWh</b>
                  </div>
                </div>
              </div>

              <div style={energyCard}>
                <div style={energyCardHeader}>
                  <div style={energyTitleWrap}>
                    <div style={energyIconBox}>
                      <FaChartLine />
                    </div>
                    <div>
                      <div style={energyCardTitle}>Used Energy Period</div>
                      <div style={energyCardSubtitle}>
                        Ringkasan penggunaan energi
                      </div>
                    </div>
                  </div>
                </div>

                <div style={tabContainer}>
                  <button
                    style={activeTab === "hari" ? tabActive : tab}
                    onClick={() => setActiveTab("hari")}
                  >
                    Hari
                  </button>

                  <button
                    style={activeTab === "minggu" ? tabActive : tab}
                    onClick={() => setActiveTab("minggu")}
                  >
                    Minggu
                  </button>

                  <button
                    style={activeTab === "bulan" ? tabActive : tab}
                    onClick={() => setActiveTab("bulan")}
                  >
                    Bulan
                  </button>
                </div>

                <div style={miniGrid}>
                  <div style={energyStatCard}>
                    <span style={energyStatLabel}>Total Energi</span>
                    <b style={energyStatValue}>
                      {activeTab === "hari"
                        ? "15.2 kWh"
                        : activeTab === "minggu"
                          ? "90 kWh"
                          : "320 kWh"}
                    </b>
                  </div>

                  <div style={energyStatCard}>
                    <span style={energyStatLabel}>Rata-rata</span>
                    <b style={energyStatValue}>
                      {activeTab === "hari"
                        ? "15.2 kWh"
                        : activeTab === "minggu"
                          ? "12.8 kWh"
                          : "10.6 kWh"}
                    </b>
                  </div>
                </div>

                <div style={periodInfoBox}>
                  Periode aktif:{" "}
                  <b>
                    {activeTab === "hari"
                      ? "Harian"
                      : activeTab === "minggu"
                        ? "Mingguan"
                        : "Bulanan"}
                  </b>
                </div>
              </div>
            </div>

            {/* CONTROL SECTION */}
            <div style={controlCard}>
              <div>
                <div style={sectionTitle}>Manual Control</div>
                <p style={controlText}>
                  Tombol ON akan membuka form alasan, lalu mengirim perintah set
                  suhu AC ke 24°C. Tombol OFF akan membuka form alasan, lalu
                  mengirim perintah mematikan AC.
                </p>
              </div>

              <div style={controlButtons}>
                <button
                  style={{
                    ...btnOn,
                    opacity: controlLoading ? 0.6 : 1,
                    cursor: controlLoading ? "not-allowed" : "pointer",
                  }}
                  disabled={controlLoading}
                  onClick={() => openReasonModal("ON")}
                >
                  ON · 24°C
                </button>

                <button
                  style={{
                    ...btnOff,
                    opacity: controlLoading ? 0.6 : 1,
                    cursor: controlLoading ? "not-allowed" : "pointer",
                  }}
                  disabled={controlLoading}
                  onClick={() => openReasonModal("OFF")}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* REASON MODAL */}
            {reasonModalOpen && (
              <div style={reasonOverlay}>
                <div style={reasonBox}>
                  <h3 style={reasonTitle}>Alasan AC di-{pendingCommand}</h3>

                  <p style={reasonSubtitle}>
                    Ruangan: <b>{selectedRoom?.name}</b>
                  </p>

                  <textarea
                    style={reasonTextarea}
                    placeholder={
                      pendingCommand === "ON"
                        ? "Contoh: Ruangan digunakan di luar jadwal untuk praktikum tambahan."
                        : "Contoh: Kelas selesai lebih awal sehingga AC dimatikan."
                    }
                    value={controlReason}
                    onChange={(e) => setControlReason(e.target.value)}
                  />

                  <div style={reasonButtonWrapper}>
                    <button
                      style={reasonCancelBtn}
                      disabled={controlLoading}
                      onClick={closeReasonModal}
                    >
                      Batal
                    </button>

                    <button
                      style={{
                        ...reasonSubmitBtn,
                        opacity: controlLoading ? 0.6 : 1,
                        cursor: controlLoading ? "not-allowed" : "pointer",
                      }}
                      disabled={controlLoading}
                      onClick={handleControl}
                    >
                      {controlLoading ? "Mengirim..." : "Kirim"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* STYLE */
const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--bg-main, #f5f6f8)",
  fontFamily: "sans-serif",
  transition: "0.2s ease",
};

const sidebar = {
  width: 220,
  background: "var(--bg-sidebar, #fff)",
  padding: "20px 20px 0 20px",
  display: "flex",
  flexDirection: "column",
  borderRight: "1px solid var(--border-color, #eee)",
  minHeight: "100vh",
  transition: "0.2s ease",
};

const sidebarInner = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const brand = {
  marginBottom: 30,
  color: "var(--text-main, #111)",
};

const container = {
  background: "var(--bg-card, #fff)",
  color: "var(--text-main, #111)",
  borderRadius: 15,
  boxShadow: "0px 5px 20px var(--shadow-color, rgba(0,0,0,0.05))",
  border: "1px solid var(--border-color, #eee)",
  overflow: "hidden",
  transition: "0.2s ease",
};

const titleBar = {
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  textAlign: "center",
  padding: 12,
  fontWeight: 600,
};

const floorTitle = {
  marginBottom: 15,
  color: "var(--text-main, #111)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.65)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  backdropFilter: "blur(4px)",
};

const modal = {
  width: "920px",
  maxWidth: "92vw",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "var(--bg-card, #fff)",
  color: "var(--text-main, #111)",
  borderRadius: 22,
  padding: 24,
  position: "relative",
  boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
  border: "1px solid var(--border-color, #eee)",
  transition: "0.2s ease",
};

const closeBtn = {
  position: "absolute",
  top: 14,
  right: 14,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid var(--border-color, #ddd)",
  background: "var(--bg-card-soft, #f8fafc)",
  color: "var(--text-main, #111)",
  fontSize: 22,
  lineHeight: "26px",
  cursor: "pointer",
  zIndex: 2,
};

const modalTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 20,
  padding: "16px 20px",
  borderRadius: 16,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
};

const modalTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
};

const modalSubtitle = {
  margin: "4px 0 0",
  fontSize: 12,
  opacity: 0.9,
};

const statusBadge = {
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 16,
};

const infoCard = {
  background: "var(--bg-card-soft, #f9fafb)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 16,
  padding: 16,
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  color: "var(--text-main, #111)",
};

const dataRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid var(--border-color, #eee)",
  fontSize: 13,
  color: "var(--text-main, #111)",
};

const energyCard = {
  background: "var(--bg-card-soft, #f9fafb)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 18,
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const energyCardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const energyTitleWrap = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const energyIconBox = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: 16,
};

const energyCardTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--text-main, #111)",
};

const energyCardSubtitle = {
  fontSize: 12,
  color: "var(--text-muted, #666)",
  marginTop: 2,
};

const dateTimeWrapper = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
};

const dateTimeCard = {
  background: "var(--bg-card, #fff)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 12,
  padding: "12px 14px",
};

const dateTimeLabel = {
  fontSize: 12,
  color: "var(--text-muted, #666)",
  display: "flex",
  alignItems: "center",
  marginBottom: 6,
};

const dateTimeValue = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-main, #111)",
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const energyStatCard = {
  background: "var(--bg-card, #fff)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 14,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const energyStatLabel = {
  fontSize: 12,
  color: "var(--text-muted, #666)",
};

const energyStatValue = {
  fontSize: 20,
  fontWeight: 800,
  color: "var(--text-main, #111)",
};

const periodInfoBox = {
  fontSize: 12,
  color: "var(--text-muted, #666)",
  background: "rgba(45, 140, 255, 0.08)",
  border: "1px solid rgba(45, 140, 255, 0.15)",
  padding: "10px 12px",
  borderRadius: 10,
};

const tabContainer = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 8,
};

const tab = {
  border: "1px solid var(--border-color, #eee)",
  background: "var(--input-bg, #eee)",
  color: "var(--text-main, #111)",
  padding: 8,
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const tabActive = {
  ...tab,
  background: "#2d8cff",
  color: "#fff",
  border: "1px solid #2d8cff",
};

const controlCard = {
  background: "var(--bg-card-soft, #f9fafb)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const controlText = {
  margin: 0,
  fontSize: 12,
  color: "var(--text-muted, #666)",
  maxWidth: 520,
};

const controlButtons = {
  display: "flex",
  gap: 8,
};

const btnOn = {
  background: "#22c55e",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 700,
};

const btnOff = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 700,
};

const reasonOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(15, 23, 42, 0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 20,
  borderRadius: 22,
};

const reasonBox = {
  width: "440px",
  maxWidth: "90%",
  background: "var(--bg-card, #fff)",
  color: "var(--text-main, #111)",
  border: "1px solid var(--border-color, #eee)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

const reasonTitle = {
  margin: "0 0 8px",
  fontSize: 18,
  fontWeight: 800,
};

const reasonSubtitle = {
  margin: "0 0 14px",
  fontSize: 13,
  color: "var(--text-muted, #666)",
};

const reasonTextarea = {
  width: "100%",
  minHeight: 110,
  resize: "vertical",
  borderRadius: 12,
  border: "1px solid var(--border-color, #eee)",
  background: "var(--input-bg, #fff)",
  color: "var(--text-main, #111)",
  padding: 12,
  outline: "none",
  fontSize: 13,
  boxSizing: "border-box",
};

const reasonButtonWrapper = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 14,
};

const reasonCancelBtn = {
  background: "var(--bg-card-soft, #f8fafc)",
  color: "var(--text-main, #111)",
  border: "1px solid var(--border-color, #eee)",
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const reasonSubmitBtn = {
  background: "#2d8cff",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};
