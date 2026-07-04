import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import MainLayout from "../components/MainLayout";
import Sidebar from "../components/Sidebar";
import { apiHeaders, apiUrl } from "../services/api";

function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [roomStatus, setRoomStatus] = useState({});
  const [roomRuntime, setRoomRuntime] = useState({});
  const [yoloData, setYoloData] = useState({});
  const [sensorData, setSensorData] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [scheduleModalRoom, setScheduleModalRoom] = useState(null);
  const [hoveredScheduleRoom, setHoveredScheduleRoom] = useState("");
  const [todayEnergySummary, setTodayEnergySummary] = useState(null);
  const [periodEnergySummary, setPeriodEnergySummary] = useState(null);
  const [dummyTick, setDummyTick] = useState(0);
  const [energyModalOpen, setEnergyModalOpen] = useState(false);
  const [selectedEnergyPeriod, setSelectedEnergyPeriod] = useState("month");
  const [hoveredEnergyButton, setHoveredEnergyButton] = useState("");
  const [selectedEnergyMonth, setSelectedEnergyMonth] = useState(
    new Date().getMonth(),
  );
  const [selectedEnergyWeek, setSelectedEnergyWeek] = useState(1);
  const [selectedEnergyDate, setSelectedEnergyDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
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
  const dayNames = {
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
    sunday: "Minggu",
  };
  const dayOrder = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
  };

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

  const fetchRuntime = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl("/rooms/runtime"), {
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
      });

      if (!res.ok) {
        console.error("Gagal ambil runtime ruangan:", res.status);
        return;
      }

      const data = await res.json();
      setRoomRuntime(data);
    } catch (err) {
      console.error("Gagal ambil runtime ruangan:", err);
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

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(apiUrl("/rooms"), {
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
      });

      if (!res.ok) {
        console.error("Gagal ambil data jadwal:", res.status);
        return;
      }

      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal ambil data jadwal:", err);
    }
  };

  const fetchEnergySummary = async (params, setter) => {
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams(params).toString();

      const res = await fetch(apiUrl(`/energy/summary?${query}`), {
        headers: apiHeaders({
          Authorization: `Bearer ${token}`,
        }),
      });

      if (!res.ok) {
        console.error("Gagal ambil data energi:", res.status);
        return;
      }

      const data = await res.json();
      setter(data);
    } catch (err) {
      console.error("Gagal ambil data energi:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchRuntime();

    const interval = setInterval(() => {
      fetchStatus();
      fetchRuntime();
    }, 5000);
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

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchEnergySummary(
      {
        period: "day",
        date: new Date().toISOString().slice(0, 10),
      },
      setTodayEnergySummary,
    );
  }, []);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const params =
      selectedEnergyPeriod === "day"
        ? {
            period: "day",
            date: selectedEnergyDate,
          }
        : selectedEnergyPeriod === "week"
          ? {
              period: "week",
              year: String(currentYear),
              month: String(selectedEnergyMonth + 1),
              week: String(selectedEnergyWeek),
            }
          : {
              period: "month",
              year: String(currentYear),
              month: String(selectedEnergyMonth + 1),
            };

    fetchEnergySummary(params, setPeriodEnergySummary);
  }, [selectedEnergyPeriod, selectedEnergyDate, selectedEnergyMonth, selectedEnergyWeek]);

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

  const formatTime = (value) => {
    if (!value) return "-";

    return String(value).slice(0, 5);
  };

  const getRoomSchedules = (roomName) => {
    return schedules
      .filter((schedule) => schedule.room_name === roomName)
      .sort((a, b) => {
        const dayA = String(a.day || "").toLowerCase();
        const dayB = String(b.day || "").toLowerCase();
        const dayDiff = (dayOrder[dayA] || 99) - (dayOrder[dayB] || 99);

        if (dayDiff !== 0) return dayDiff;

        return String(a.start_time || "").localeCompare(String(b.start_time || ""));
      });
  };

  const getScheduleSummary = (roomName) => {
    const roomSchedules = getRoomSchedules(roomName);

    if (roomSchedules.length === 0) {
      return "Belum ada jadwal";
    }

    const firstSchedule = roomSchedules[0];
    const day = String(firstSchedule.day || "").toLowerCase();

    return `${dayNames[day] || firstSchedule.day} ${formatTime(firstSchedule.start_time)}`;
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
    fetchRuntime();
    fetchYoloData();
    fetchSensorData();
    fetchSchedules();
    fetchEnergySummary(
      {
        period: "day",
        date: new Date().toISOString().slice(0, 10),
      },
      setTodayEnergySummary,
    );
  };

  const getActualEnergyByRoom = (roomName) => {
    return periodEnergySummary?.rooms?.find(
      (room) => room.room_name === roomName,
    );
  };

  const getMonthlyEnergyValue = (roomName) => {
    const seed = getRoomSeed(roomName);
    const base = dummyRoomData[roomName];

    if (roomName === IMPLEMENTED_ROOM) {
      return null;
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
      return null;
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

  const getDailyEnergyValue = (roomName) => {
    const seed = getRoomSeed(roomName);
    const base = dummyRoomData[roomName];
    const day = Number(selectedEnergyDate.split("-")[2] || 1);

    if (roomName === IMPLEMENTED_ROOM) {
      return null;
    }

    if (!base) return 0;

    if (base.status === "OFF") {
      return 0.6 + ((seed + day) % 3) * 0.4;
    }

    return 6 + base.occ * 0.28 + ((seed + day) % 6);
  };

  const energyPeriodData = rooms.map((room) => {
    const actualEnergy = getActualEnergyByRoom(room.name);
    let usageSource = null;

    if (actualEnergy) {
      usageSource = actualEnergy.total_energy_kwh;
    } else if (room.name !== IMPLEMENTED_ROOM) {
      usageSource =
        selectedEnergyPeriod === "day"
          ? getDailyEnergyValue(room.name)
          : selectedEnergyPeriod === "week"
            ? getWeeklyEnergyValue(room.name)
            : getMonthlyEnergyValue(room.name);
    }

    const usage =
      typeof usageSource === "number" ? Number(usageSource.toFixed(1)) : null;

    return {
      ...room,
      usage,
      hours: actualEnergy
        ? Math.round(actualEnergy.total_duration_minutes / 60)
        : typeof usage === "number"
          ? Math.round(usage / 2.4)
          : null,
    };
  });
  const totalPeriodEnergy = energyPeriodData.reduce(
    (total, room) => total + (typeof room.usage === "number" ? room.usage : 0),
    0,
  );
  const roomsWithEnergyData = energyPeriodData.filter(
    (room) => typeof room.usage === "number",
  );
  const averagePeriodEnergy =
    roomsWithEnergyData.length > 0
      ? totalPeriodEnergy / roomsWithEnergyData.length
      : 0;
  const maxPeriodEnergy = Math.max(
    ...energyPeriodData.map((room) =>
      typeof room.usage === "number" ? room.usage : 0,
    ),
    1,
  );
  const selectedPeriodLabel =
    selectedEnergyPeriod === "day"
      ? new Date(selectedEnergyDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : selectedEnergyPeriod === "week"
      ? `Minggu ${selectedEnergyWeek} - ${monthNames[selectedEnergyMonth]} ${new Date().getFullYear()}`
      : `${monthNames[selectedEnergyMonth]} ${new Date().getFullYear()}`;
  const todayEnergyValue =
    typeof todayEnergySummary?.total_energy_kwh === "number"
      ? `${todayEnergySummary.total_energy_kwh.toFixed(3)} kWh`
      : "0 kWh";

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
            value={todayEnergyValue}
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
            <div>Schedule</div>
          </div>

          {filteredRooms.map((r) => {
            const dummyData = getAnimatedDummyData(r.name);
            const useDummyData = r.name !== IMPLEMENTED_ROOM && dummyData;
            const latestYolo = yoloData?.[r.name];
            const runtime = roomRuntime?.[r.name];
            const status =
              useDummyData
                ? dummyData.status
                : roomStatus?.[r.name] ??
                  (isFreshData(latestYolo) ? latestYolo?.ac_status : undefined);
            const isOn = status === "ON";

            const latestSensor = sensorData?.[r.name];
            const hasFreshSensorData = isFreshData(latestSensor);
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
                  runtime?.last_command?.fan ||
                    latestYolo?.applied_fan_speed ||
                    latestYolo?.fan_speed ||
                    r.fan,
                  isOn,
                );
            const occupancy = useDummyData
              ? dummyData.occ
              : hasYoloData
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
                <div>
                  <button
                    type="button"
                    style={{
                      ...scheduleButton,
                      ...(hoveredScheduleRoom === r.name
                        ? scheduleButtonHover
                        : {}),
                    }}
                    title={getScheduleSummary(r.name)}
                    onMouseEnter={() => setHoveredScheduleRoom(r.name)}
                    onMouseLeave={() => setHoveredScheduleRoom("")}
                    onClick={() => setScheduleModalRoom(r.name)}
                  >
                    Jadwal
                  </button>
                </div>
              </div>
            );
          })}

          {filteredRooms.length === 0 && (
            <div style={emptyRow}>Tidak ada ruangan ditemukan</div>
          )}
        </div>

        {scheduleModalRoom && (
          <div style={modalOverlay}>
            <div style={scheduleModal}>
              <div style={energyModalHeader}>
                <div>
                  <div style={modalEyebrow}>Schedule Room</div>
                  <h2 style={modalTitle}>{scheduleModalRoom}</h2>
                  <p style={modalSubtitle}>
                    Daftar jadwal penggunaan ruang yang tersimpan pada database.
                  </p>
                </div>

                <button
                  type="button"
                  style={modalCloseButton}
                  onClick={() => setScheduleModalRoom(null)}
                >
                  Ã—
                </button>
              </div>

              <div style={scheduleList}>
                {getRoomSchedules(scheduleModalRoom).length > 0 ? (
                  getRoomSchedules(scheduleModalRoom).map((schedule) => {
                    const day = String(schedule.day || "").toLowerCase();

                    return (
                      <div key={schedule.id} style={scheduleItem}>
                        <div>
                          <div style={scheduleDay}>
                            {dayNames[day] || schedule.day}
                          </div>
                          <div style={scheduleTime}>
                            {formatTime(schedule.start_time)} -{" "}
                            {formatTime(schedule.end_time)}
                          </div>
                        </div>
                        <span style={scheduleBadge}>Aktif Terjadwal</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={emptySchedule}>
                    Belum ada jadwal untuk ruangan ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                        selectedEnergyPeriod === "day"
                          ? periodToggleActive
                          : {
                              ...periodToggleButton,
                              ...(hoveredEnergyButton === "day"
                                ? periodToggleButtonHover
                                : {}),
                            }
                      }
                      onMouseEnter={() => setHoveredEnergyButton("day")}
                      onMouseLeave={() => setHoveredEnergyButton("")}
                      onClick={() => setSelectedEnergyPeriod("day")}
                    >
                      Hari
                    </button>
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

                {selectedEnergyPeriod === "day" && (
                  <label style={selectLabel}>
                    Tanggal
                    <input
                      type="date"
                      style={monthSelect}
                      value={selectedEnergyDate}
                      onChange={(e) => setSelectedEnergyDate(e.target.value)}
                    />
                  </label>
                )}

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
                            width:
                              typeof room.usage === "number"
                                ? `${Math.max(
                                    (room.usage / maxPeriodEnergy) * 100,
                                    5,
                                  )}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <div style={barValue}>
                        {typeof room.usage === "number"
                          ? `${room.usage.toFixed(1)} kWh`
                          : "-"}
                      </div>
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
                    <div>
                      {typeof room.hours === "number" ? `${room.hours} Jam` : "-"}
                    </div>
                    <div>
                      {typeof room.usage === "number"
                        ? `${room.usage.toFixed(1)} kWh`
                        : "-"}
                    </div>
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
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
  padding: 15,
  background: "linear-gradient(90deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  fontWeight: 600,
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
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

const scheduleButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(45, 140, 255, 0.14)",
  color: "#93c5fd",
  border: "1px solid rgba(96, 165, 250, 0.32)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  transition: "0.18s ease",
};

const scheduleButtonHover = {
  background: "rgba(45, 140, 255, 0.3)",
  color: "#dbeafe",
  border: "1px solid rgba(96, 165, 250, 0.62)",
  transform: "translateY(-1px)",
  boxShadow: "0 10px 18px rgba(45, 140, 255, 0.14)",
};

const scheduleModal = {
  width: "520px",
  maxWidth: "92vw",
  background:
    "linear-gradient(145deg, rgba(17, 34, 58, 0.99), rgba(8, 17, 34, 0.99))",
  color: "#f8fafc",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 30px 90px rgba(0,0,0,0.48)",
  border: "1px solid rgba(96, 165, 250, 0.22)",
};

const scheduleList = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const scheduleItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  background: "rgba(30, 43, 66, 0.98)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 14,
  padding: "13px 14px",
};

const scheduleDay = {
  fontSize: 14,
  fontWeight: 800,
  color: "#f8fafc",
};

const scheduleTime = {
  marginTop: 4,
  fontSize: 13,
  color: "#cbd5e1",
};

const scheduleBadge = {
  flexShrink: 0,
  background: "rgba(34, 197, 94, 0.14)",
  color: "#4ade80",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 11,
  fontWeight: 800,
};

const emptySchedule = {
  background: "rgba(30, 43, 66, 0.98)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 14,
  padding: 16,
  color: "#cbd5e1",
  fontSize: 13,
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
  gridTemplateColumns: "1fr 1fr 1fr",
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

