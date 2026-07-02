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
  const [dummyTick, setDummyTick] = useState(0);
  const DATA_FRESH_MS = 30 * 1000;
  const IMPLEMENTED_ROOM = "Ruang Kelas 2.04";

  const dummyRoomData = {
    "Ruang Kelas 2.02": {
      temp: 24.8,
      humidity: 61.5,
      fan: "Low",
      occ: 12,
      status: "ON",
    },
    "Ruang Kelas 2.03": {
      temp: 25.1,
      humidity: 59.8,
      fan: "Low",
      occ: 8,
      status: "ON",
    },
    "Ruang Kelas 2.05": {
      temp: 26.0,
      humidity: 63.2,
      fan: "OFF",
      occ: 0,
      status: "OFF",
    },
    "Ruang Kelas 2.06": {
      temp: 24.5,
      humidity: 60.1,
      fan: "Medium",
      occ: 17,
      status: "ON",
    },
    "Ruang Kelas 2.07": {
      temp: 25.7,
      humidity: 62.4,
      fan: "Low",
      occ: 6,
      status: "ON",
    },
    "Ruang Kelas 2.08": {
      temp: 26.4,
      humidity: 64.0,
      fan: "OFF",
      occ: 0,
      status: "OFF",
    },
    "Ruang Kelas 2.09": {
      temp: 24.2,
      humidity: 58.7,
      fan: "Medium",
      occ: 21,
      status: "ON",
    },
    "Ruang Kelas 2.23": {
      temp: 25.9,
      humidity: 62.9,
      fan: "Low",
      occ: 9,
      status: "ON",
    },
    "Ruang Kelas 2.24": {
      temp: 26.2,
      humidity: 65.1,
      fan: "OFF",
      occ: 0,
      status: "OFF",
    },
    "Ruang Kelas 2.25": {
      temp: 24.0,
      humidity: 59.3,
      fan: "Medium",
      occ: 18,
      status: "ON",
    },
    "Ruang Kelas 2.15": {
      temp: 25.4,
      humidity: 61.0,
      fan: "Low",
      occ: 7,
      status: "ON",
    },
    "Ruang Kelas 2.16": {
      temp: 26.1,
      humidity: 63.8,
      fan: "OFF",
      occ: 0,
      status: "OFF",
    },
    "Ruang Kelas 2.17": {
      temp: 24.7,
      humidity: 60.5,
      fan: "Low",
      occ: 10,
      status: "ON",
    },
    "Ruang Kelas 2.18": {
      temp: 23.9,
      humidity: 58.9,
      fan: "Medium",
      occ: 24,
      status: "ON",
    },
    "Ruang Kelas 2.19": {
      temp: 25.8,
      humidity: 62.7,
      fan: "Low",
      occ: 5,
      status: "ON",
    },
    "Ruang Kelas 2.20": {
      temp: 26.5,
      humidity: 64.5,
      fan: "OFF",
      occ: 0,
      status: "OFF",
    },
    "Ruang Kelas 2.35": {
      temp: 24.3,
      humidity: 59.6,
      fan: "Medium",
      occ: 16,
      status: "ON",
    },
    "Ruang Kelas 2.36": {
      temp: 25.0,
      humidity: 61.9,
      fan: "Low",
      occ: 11,
      status: "ON",
    },
  };

  const getRoomSeed = (roomName) =>
    roomName.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

  const getAnimatedDummyData = (roomName) => {
    const base = dummyRoomData[roomName];

    if (!base) return null;

    const seed = getRoomSeed(roomName);
    const tempDelta = ((dummyTick + seed) % 5 - 2) * 0.1;
    const humidityDelta = ((dummyTick * 2 + seed) % 7 - 3) * 0.2;
    const occupancyDelta =
      base.status === "ON" ? ((dummyTick + seed) % 5) - 2 : 0;
    const occupancy = Math.max(0, base.occ + occupancyDelta);

    return {
      ...base,
      temp: `${(base.temp + tempDelta).toFixed(1)}\u00B0C`,
      humidity: `${(base.humidity + humidityDelta).toFixed(1)}%`,
      occ: `${occupancy} People`,
    };
  };

  const getRoomsData = async () => {
    const data = [
      {
        lantai: "Sayap Kanan",
        rooms: [
          { name: "Ruang Kelas 2.02" },
          { name: "Ruang Kelas 2.03" },
          { name: "Ruang Kelas 2.03" },
          { name: "Ruang Kelas 2.04" },
        ],
      },
      {
        lantai: "",
        rooms: [
          { name: "Ruang Kelas 2.05" },
          { name: "Ruang Kelas 2.06" },
          { name: "Ruang Kelas 2.07" },
          { name: "Ruang Kelas 2.08" },
        ],
      },
      {
        lantai: "",
        rooms: [
          { name: "Ruang Kelas 2.09" },
          { name: "Ruang Kelas 2.23" },
          { name: "Ruang Kelas 2.24" },
          { name: "Ruang Kelas 2.25" },
        ],
      },
      {
        lantai: "Sayap Kiri",
        rooms: [
          { name: "Ruang Kelas 2.15" },
          { name: "Ruang Kelas 2.16" },
          { name: "Ruang Kelas 2.17" },
          { name: "Ruang Kelas 2.18" },
        ],
      },
      {
        lantai: "",
        rooms: [
          { name: "Ruang Kelas 2.19" },
          { name: "Ruang Kelas 2.20" },
          { name: "Ruang Kelas 2.35" },
          { name: "Ruang Kelas 2.36" },
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

  useEffect(() => {
    const interval = setInterval(() => {
      setDummyTick((prev) => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
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

    return `${numberValue.toFixed(1)}\u00B0C`;
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

          <button
            className="action-button action-button-primary"
            style={refreshBtn}
            onClick={handleRefresh}
          >
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
            const dummyData = getAnimatedDummyData(r.name);
            const useDummyData = r.name !== IMPLEMENTED_ROOM && dummyData;
            const latestYolo = yoloData?.[r.name];
            const status =
              useDummyData
                ? dummyData.status
                : roomStatus?.[r.name] ??
                  (isFreshData(latestYolo) ? latestYolo?.ac_status : undefined);
            const isOn = status === "ON";

            const latestSensor = sensorData?.[r.name];
            const hasFreshSensorData = isOn && isFreshData(latestSensor);
            const hasYoloData = Boolean(latestYolo);

            const temperature = useDummyData
              ? dummyData.temp
              : hasFreshSensorData
                ? formatTemperature(latestSensor?.temperature)
                : "-";
            const humidity = useDummyData
              ? dummyData.humidity
              : hasFreshSensorData
                ? formatHumidity(latestSensor?.humidity)
                : "-";
            const fanSpeed = useDummyData
              ? dummyData.fan
              : formatAppliedFanSpeed(
                  hasYoloData ? latestYolo?.applied_fan_speed || r.fan : null,
                  isOn && hasYoloData,
                );
            const occupancy = useDummyData
              ? dummyData.occ
              : isOn && hasYoloData
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

