import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import MainLayout from "../components/MainLayout";
import Sidebar from "../components/Sidebar";
import { apiHeaders, apiUrl } from "../services/api";

function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [roomStatus, setRoomStatus] = useState({});
  const [yoloData, setYoloData] = useState({});
  const [sensorData, setSensorData] = useState({});
  const DATA_FRESH_MS = 30 * 1000;

  const getRoomsData = async () => {
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

    return data.flatMap((floor, i) =>
      floor.rooms.map((room, j) => ({
        id: i * 10 + j,
        name: room.name,
        temp: "-",
        humidity: "-",
        fan: "-",
        occ: "0 People",
      })),
    );
  };

  useEffect(() => {
    const loadData = async () => {
      const data = await getRoomsData();
      setRooms(data);
    };

    loadData();
  }, []);

  // =========================
  // FETCH STATUS ROOM
  // =========================
  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl("/rooms/status"), {
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
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

  // =========================
  // FETCH DATA YOLO REALTIME
  // =========================
  const fetchYoloData = async () => {
    try {
      const res = await fetch(apiUrl("/detection/latest"), {
        headers: apiHeaders(),
      });

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

  // =========================
  // FETCH DATA SENSOR IOT REALTIME
  // =========================
  const fetchSensorData = async () => {
    try {
      const res = await fetch(apiUrl("/mqtt/sensor/latest"), {
        headers: apiHeaders(),
      });

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

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchYoloData();

    const interval = setInterval(fetchYoloData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSensorData();

    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // FORMAT DATA
  // =========================
  const formatTemperature = (value) => {
    if (value === undefined || value === null || value === "") return "-";

    const numberValue = Number(value);

    if (isNaN(numberValue)) return "-";

    return `${numberValue.toFixed(1)}°C`;
  };

  const formatHumidity = (value) => {
    if (value === undefined || value === null || value === "") return "-";

    const numberValue = Number(value);

    if (isNaN(numberValue)) return "-";

    return `${numberValue.toFixed(1)}%`;
  };

  const toTitleCase = (value) => {
    return String(value)
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatFanSpeed = (value) => {
    if (!value) return "-";

    return toTitleCase(value);
  };

  const formatAppliedFanSpeed = (value, isOn) => {
    if (!isOn) return "OFF";

    return formatFanSpeed(value);
  };

  const formatOccupancy = (value, fallback = "0 People") => {
    if (value === undefined || value === null) return fallback;

    return `${value} People`;
  };

  const isFreshData = (data) => {
    if (!data?.updated_at) return false;

    const updatedAt = new Date(data.updated_at).getTime();

    if (isNaN(updatedAt)) return false;

    return Date.now() - updatedAt <= DATA_FRESH_MS;
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRefresh = async () => {
    const data = await getRoomsData();
    setRooms(data);
    setSearch("");
    fetchStatus();
    fetchYoloData();
    fetchSensorData();
  };

  return (
    <div className="app-shell" style={layoutStyle}>
      <Sidebar />

      {/* MAIN */}
      <MainLayout
        title="Dashboard Ventra"
        subtitle="Kelola ruang dan status AC secara real-time"
      >
        <div className="stat-grid" style={cardWrapper}>
          <Card
            title="TOTAL RUANGAN"
            value={rooms.length}
            subtitle="Semua ruangan terdaftar"
          />
          <Card
            title="USED ENERGY"
            value="15.2 kWh"
            subtitle="Energi Terpakai"
          />
        </div>

        <div className="toolbar-row" style={searchWrapper}>
          <div style={searchStyle}>
            <FaSearch style={{ color: "var(--text-muted)" }} />
            <input
              placeholder="Search..."
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button style={refreshBtn} onClick={handleRefresh}>
            Refresh
          </button>
        </div>

        <div className="table-scroll" style={tableContainer}>
          <div className="table-grid dashboard-table-grid table-header-row" style={tableHeader}>
            <div>Room</div>
            <div>Temperature</div>
            <div>Humidity</div>
            <div>Fan Speed</div>
            <div>Occupancy</div>
            <div>Status</div>
          </div>

          {filteredRooms.map((r) => {
            const latestYolo = yoloData?.[r.name];
            const status =
              roomStatus?.[r.name] ??
              (isFreshData(latestYolo) ? latestYolo?.ac_status : undefined);
            const isOn = status === "ON";

            const latestSensor = sensorData?.[r.name];
            const hasFreshSensorData = isOn && isFreshData(latestSensor);
            const hasYoloData = Boolean(latestYolo);

            const temperature = hasFreshSensorData
              ? formatTemperature(latestSensor?.temperature)
              : "-";
            const humidity = hasFreshSensorData
              ? formatHumidity(latestSensor?.humidity)
              : "-";
            const fanSpeed = formatAppliedFanSpeed(
              hasYoloData ? latestYolo?.applied_fan_speed || r.fan : null,
              isOn && hasYoloData,
            );
            const occupancy = hasYoloData
              ? formatOccupancy(latestYolo?.occupancy, r.occ)
              : "-";

            return (
              <div key={r.id} className="table-grid dashboard-table-grid table-data-row" style={tableRow}>
                <div>{r.name}</div>
                <div>{temperature}</div>
                <div>{humidity}</div>
                <div>{fanSpeed}</div>
                <div>{occupancy}</div>
                <div>
                  <span
                    style={{
                      color: isOn ? "#22c55e" : "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {isOn ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredRooms.length === 0 && (
            <div style={emptyRow}>Tidak ada ruangan ditemukan</div>
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
  background: "var(--bg-main)",
  fontFamily: "sans-serif",
  transition: "0.2s ease",
};

const cardWrapper = {
  display: "flex",
  gap: 20,
};

const cardStyle = {
  flex: 1,
  background: "var(--bg-card)",
  color: "var(--text-main)",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0px 5px 15px var(--shadow-color)",
  border: "1px solid var(--border-color)",
  transition: "0.2s ease",
};

const cardTitle = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const cardValue = {
  margin: "10px 0",
  color: "var(--text-main)",
};

const cardSubtitle = {
  fontSize: 12,
  color: "var(--text-muted)",
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
  background: "var(--input-bg)",
  color: "var(--text-main)",
  padding: "10px 15px",
  borderRadius: 10,
  border: "1px solid var(--border-color)",
  transition: "0.2s ease",
};

const inputStyle = {
  border: "none",
  outline: "none",
  flex: 1,
  background: "transparent",
  color: "var(--text-main)",
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
  background: "var(--bg-card)",
  color: "var(--text-main)",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid var(--border-color)",
  transition: "0.2s ease",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
  padding: 15,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontWeight: 600,
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
  padding: 15,
  borderBottom: "1px solid var(--border-color)",
  color: "var(--text-main)",
};

const emptyRow = {
  padding: 15,
  color: "var(--text-muted)",
  fontSize: 14,
};

export default Dashboard;
