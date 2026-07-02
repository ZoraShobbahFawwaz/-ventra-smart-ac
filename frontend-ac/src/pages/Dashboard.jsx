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
  const [energyModalOpen, setEnergyModalOpen] = useState(false);
  const [selectedEnergyPeriod, setSelectedEnergyPeriod] = useState("month");
  const [hoveredEnergyButton, setHoveredEnergyButton] = useState("");
  const [selectedEnergyMonth, setSelectedEnergyMonth] = useState(
    new Date().getMonth(),
  );
  const [selectedEnergyWeek, setSelectedEnergyWeek] = useState(1);
  const DATA_FRESH_MS = 30 * 1000;
  const IMPLEMENTED_ROOM = "Ruang Kelas 2.04";
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dummyRoomData = {
    "Ruang Kelas 2.01": {
      temp: 25.2,
      humidity: 60.8,
      fan: "Low",
      occ: 9,
      status: "ON",
    },
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
          { name: "Ruang Kelas 2.01" },
          { name: "Ruang Kelas 2.02" },
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
    }, 5000);

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

  const getMonthlyEnergyValue = (roomName) => {
    const seed = getRoomSeed(roomName);
    const base = dummyRoomData[roomName];

    if (roomName === IMPLEMENTED_ROOM) {
      return 285 + selectedEnergyMonth * 4 + (seed % 18);
    }

    if (!base) return 0;

    if (base.status === "OFF") {
      return 18 + ((seed + selectedEnergyMonth) % 18);
    }

    return 185 + (base.occ * 4.6) + ((seed + selectedEnergyMonth * 7) % 42);
  };

  const getWeeklyEnergyValue = (roomName) => {
    const seed = getRoomSeed(roomName);
    const base = dummyRoomData[roomName];
    const weekFactor = selectedEnergyWeek * 3;

    if (roomName === IMPLEMENTED_ROOM) {
      return 62 + selectedEnergyMonth * 1.2 + weekFactor + (seed % 8);
    }

    if (!base) return 0;

    if (base.status === "OFF") {
      return 4 + ((seed + selectedEnergyMonth + selectedEnergyWeek) % 6);
    }

    return (
      38 +
      base.occ * 1.1 +
      weekFactor +
      ((seed + selectedEnergyMonth * 5 + selectedEnergyWeek) % 12)
    );
  };

  const energyPeriodData = rooms.map((room) => {
    const usageSource =
      selectedEnergyPeriod === "week"
        ? getWeeklyEnergyValue(room.name)
        : getMonthlyEnergyValue(room.name);
    const usage = Number(usageSource.toFixed(1));

    return {
      ...room,
      usage,
      hours: Math.round(usage / 2.4),
    };
  });
  const totalPeriodEnergy = energyPeriodData.reduce(
    (total, room) => total + room.usage,
    0,
  );
  const averagePeriodEnergy =
    energyPeriodData.length > 0
      ? totalPeriodEnergy / energyPeriodData.length
      : 0;
  const maxPeriodEnergy = Math.max(
    ...energyPeriodData.map((room) => room.usage),
    1,
  );
  const selectedPeriodLabel =
    selectedEnergyPeriod === "week"
      ? `Minggu ${selectedEnergyWeek} - ${monthNames[selectedEnergyMonth]} ${new Date().getFullYear()}`
      : `${monthNames[selectedEnergyMonth]} ${new Date().getFullYear()}`;

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
            subtitle="Energi Terpakai Hari Ini"
          />
          <Card
            title="USED ENERGY PERIOD"
            value={`${totalPeriodEnergy.toFixed(1)} kWh`}
            subtitle={`Periode ${selectedPeriodLabel}`}
            actionLabel="Lihat Detail Periode"
            onAction={() => setEnergyModalOpen(true)}
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

        {energyModalOpen && (
          <div style={modalOverlay}>
            <div style={energyModal}>
              <div style={energyModalHeader}>
                <div>
                  <div style={modalEyebrow}>Used Energy Period</div>
                  <h2 style={modalTitle}>Penggunaan Energi Periode</h2>
                  <p style={modalSubtitle}>
                    Ringkasan penggunaan AC berdasarkan ruangan pada periode
                    minggu atau bulan terpilih.
                  </p>
                </div>

                <button
                  type="button"
                  style={modalCloseButton}
                  onClick={() => setEnergyModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div style={energyToolbar}>
                <label style={selectLabel}>
                  Periode
                  <div style={periodToggle}>
                    <button
                      type="button"
                      style={
                        selectedEnergyPeriod === "week"
                          ? periodToggleActive
                          : {
                              ...periodToggleButton,
                              ...(hoveredEnergyButton === "week"
                                ? periodToggleButtonHover
                                : {}),
                            }
                      }
                      onMouseEnter={() => setHoveredEnergyButton("week")}
                      onMouseLeave={() => setHoveredEnergyButton("")}
                      onClick={() => setSelectedEnergyPeriod("week")}
                    >
                      Minggu
                    </button>
                    <button
                      type="button"
                      style={
                        selectedEnergyPeriod === "month"
                          ? periodToggleActive
                          : {
                              ...periodToggleButton,
                              ...(hoveredEnergyButton === "month"
                                ? periodToggleButtonHover
                                : {}),
                            }
                      }
                      onMouseEnter={() => setHoveredEnergyButton("month")}
                      onMouseLeave={() => setHoveredEnergyButton("")}
                      onClick={() => setSelectedEnergyPeriod("month")}
                    >
                      Bulan
                    </button>
                  </div>
                </label>

                <label style={selectLabel}>
                  Bulan Acuan
                  <select
                    style={monthSelect}
                    value={selectedEnergyMonth}
                    onChange={(e) =>
                      setSelectedEnergyMonth(Number(e.target.value))
                    }
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index}>
                        {month} {new Date().getFullYear()}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedEnergyPeriod === "week" && (
                  <label style={selectLabel}>
                    Minggu Ke-
                    <select
                      style={monthSelect}
                      value={selectedEnergyWeek}
                      onChange={(e) =>
                        setSelectedEnergyWeek(Number(e.target.value))
                      }
                    >
                      {[1, 2, 3, 4].map((week) => (
                        <option key={week} value={week}>
                          Minggu {week}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div style={energySummaryGrid}>
                  <div style={energySummaryCard}>
                    <span>Total Energi</span>
                    <b>{totalPeriodEnergy.toFixed(1)} kWh</b>
                  </div>
                  <div style={energySummaryCard}>
                    <span>Rata-rata Ruangan</span>
                    <b>{averagePeriodEnergy.toFixed(1)} kWh</b>
                  </div>
                </div>
              </div>

              <div style={chartCard}>
                <div style={chartTitle}>
                  Grafik Penggunaan Energi per Ruangan ({selectedPeriodLabel})
                </div>
                <div style={barChart}>
                  {energyPeriodData.map((room) => (
                    <div key={room.id} style={barItem}>
                      <div style={barLabel}>{room.name.replace("Ruang Kelas ", "")}</div>
                      <div style={barTrack}>
                        <div
                          style={{
                            ...barFill,
                            width: `${Math.max(
                              (room.usage / maxPeriodEnergy) * 100,
                              5,
                            )}%`,
                          }}
                        />
                      </div>
                      <div style={barValue}>{room.usage.toFixed(1)} kWh</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={energyTableWrapper}>
                <div style={energyTableHeader}>
                  <div>Room</div>
                  <div>Jam Operasi</div>
                  <div>Energi</div>
                </div>

                {energyPeriodData.map((room) => (
                  <div key={room.id} style={energyTableRow}>
                    <div>{room.name}</div>
                    <div>{room.hours} Jam</div>
                    <div>{room.usage.toFixed(1)} kWh</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </div>
  );
}

const Card = ({ title, value, subtitle, hint, onClick, actionLabel, onAction }) => {
  const [isActionHovered, setIsActionHovered] = useState(false);

  return (
    <div
      style={{
        ...cardStyle,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
    >
      <div style={cardTitle}>{title}</div>
      <h2 style={cardValue}>{value}</h2>
      <div style={cardSubtitle}>{subtitle}</div>
      {hint && <div style={cardHint}>{hint}</div>}
      {actionLabel && (
        <button
          type="button"
          style={{
            ...cardMiniAction,
            ...(isActionHovered ? cardMiniActionHover : {}),
          }}
          onMouseEnter={() => setIsActionHovered(true)}
          onMouseLeave={() => setIsActionHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

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

const cardHint = {
  marginTop: 10,
  fontSize: 12,
  color: "#60a5fa",
  fontWeight: 600,
};

const cardMiniAction = {
  marginTop: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  background: "rgba(45, 140, 255, 0.14)",
  color: "#60a5fa",
  border: "1px solid rgba(96, 165, 250, 0.32)",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  transition: "0.18s ease",
};

const cardMiniActionHover = {
  background: "rgba(45, 140, 255, 0.28)",
  border: "1px solid rgba(96, 165, 250, 0.58)",
  color: "#bfdbfe",
  transform: "translateY(-1px)",
  boxShadow: "0 10px 20px rgba(45, 140, 255, 0.16)",
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

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 8, 23, 0.78)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  backdropFilter: "blur(8px)",
};

const energyModal = {
  width: "980px",
  maxWidth: "92vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background:
    "linear-gradient(145deg, rgba(17, 34, 58, 0.99), rgba(8, 17, 34, 0.99))",
  color: "#f8fafc",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 30px 90px rgba(0,0,0,0.48)",
  border: "1px solid rgba(96, 165, 250, 0.22)",
};

const energyModalHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  marginBottom: 18,
};

const modalEyebrow = {
  color: "#93c5fd",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 6,
};

const modalTitle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
};

const modalSubtitle = {
  margin: "6px 0 0",
  color: "#cbd5e1",
  fontSize: 13,
};

const modalCloseButton = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.5)",
  color: "#f8fafc",
  fontSize: 22,
  cursor: "pointer",
};

const energyToolbar = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const selectLabel = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 700,
};

const monthSelect = {
  background: "rgba(15, 23, 42, 0.55)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 12,
  padding: "11px 12px",
  outline: "none",
};

const periodToggle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const periodToggleButton = {
  background: "rgba(15, 23, 42, 0.55)",
  color: "#e2e8f0",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  transition: "0.18s ease",
};

const periodToggleButtonHover = {
  background: "rgba(45, 140, 255, 0.18)",
  color: "#bfdbfe",
  border: "1px solid rgba(96, 165, 250, 0.48)",
  transform: "translateY(-1px)",
  boxShadow: "0 10px 18px rgba(45, 140, 255, 0.12)",
};

const periodToggleActive = {
  ...periodToggleButton,
  background: "#2d8cff",
  color: "#fff",
  border: "1px solid #2d8cff",
  boxShadow: "0 10px 18px rgba(45, 140, 255, 0.16)",
};

const energySummaryGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const energySummaryCard = {
  background: "rgba(45, 140, 255, 0.11)",
  border: "1px solid rgba(96, 165, 250, 0.22)",
  borderRadius: 14,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const chartCard = {
  background: "rgba(30, 43, 66, 0.98)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
};

const chartTitle = {
  fontWeight: 800,
  marginBottom: 14,
};

const barChart = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const barItem = {
  display: "grid",
  gridTemplateColumns: "72px 1fr 92px",
  gap: 10,
  alignItems: "center",
  fontSize: 12,
};

const barLabel = {
  color: "#cbd5e1",
  fontWeight: 700,
};

const barTrack = {
  height: 12,
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.65)",
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.12)",
};

const barFill = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #2d8cff, #22c55e)",
};

const barValue = {
  color: "#f8fafc",
  fontWeight: 700,
  textAlign: "right",
};

const energyTableWrapper = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 14,
  overflow: "hidden",
};

const energyTableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  padding: "12px 14px",
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 13,
};

const energyTableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  padding: "12px 14px",
  borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
  color: "#e2e8f0",
  fontSize: 13,
};

export default Dashboard;

