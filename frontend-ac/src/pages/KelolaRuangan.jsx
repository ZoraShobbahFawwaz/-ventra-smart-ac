import React, { useState, useEffect } from "react";
import {
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";
import MainLayout from "../components/MainLayout";
import Sidebar from "../components/Sidebar";
import { apiHeaders, apiUrl } from "../services/api";

function RoomCard({ room, isOn, onOpen }) {
  return (
    <div
      className={`room-card ${isOn ? "room-card-on" : "room-card-off"}`}
      style={{
        height: 120,
        padding: 15,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div className="room-card-title">{room.name}</div>

      <div className="room-card-status">
        <span className="room-card-dot"></span>
        <span>{isOn ? "ON" : "OFF"}</span>
      </div>

      <button type="button" className="room-card-detail" onClick={onOpen}>
        Lihat detail -&gt;
      </button>
    </div>
  );
}

export default function KelolaRuangan() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("hari");
  const [roomStatus, setRoomStatus] = useState({});
  const [yoloData, setYoloData] = useState({});
  const [sensorData, setSensorData] = useState({});
  const [todayEnergySummary, setTodayEnergySummary] = useState(null);
  const [periodEnergySummary, setPeriodEnergySummary] = useState(null);
  const [hoveredEnergyTab, setHoveredEnergyTab] = useState("");
  const [dummyTick, setDummyTick] = useState(0);
  const [controlLoading, setControlLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState("");
  const [controlReason, setControlReason] = useState("");

  const selectedYoloData = selectedRoom ? yoloData[selectedRoom.name] : null;
  const selectedSensorData = selectedRoom
    ? sensorData[selectedRoom.name]
    : null;
  const DATA_FRESH_MS = 30 * 1000;
  const IMPLEMENTED_ROOM = "Ruang Kelas 2.04";

  const dummyRoomData = {
    "Ruang Kelas 2.01": { temp: 25.2, humidity: 60.8, fan: "Low", occ: 9, status: "ON" },
    "Ruang Kelas 2.02": { temp: 24.8, humidity: 61.5, fan: "Low", occ: 12, status: "ON" },
    "Ruang Kelas 2.03": { temp: 25.1, humidity: 59.8, fan: "Low", occ: 8, status: "ON" },
    "Ruang Kelas 2.05": { temp: 26.0, humidity: 63.2, fan: "OFF", occ: 0, status: "OFF" },
    "Ruang Kelas 2.06": { temp: 24.5, humidity: 60.1, fan: "Medium", occ: 17, status: "ON" },
    "Ruang Kelas 2.07": { temp: 25.7, humidity: 62.4, fan: "Low", occ: 6, status: "ON" },
    "Ruang Kelas 2.08": { temp: 26.4, humidity: 64.0, fan: "OFF", occ: 0, status: "OFF" },
    "Ruang Kelas 2.09": { temp: 24.2, humidity: 58.7, fan: "Medium", occ: 21, status: "ON" },
    "Ruang Kelas 2.23": { temp: 25.9, humidity: 62.9, fan: "Low", occ: 9, status: "ON" },
    "Ruang Kelas 2.24": { temp: 26.2, humidity: 65.1, fan: "OFF", occ: 0, status: "OFF" },
    "Ruang Kelas 2.25": { temp: 24.0, humidity: 59.3, fan: "Medium", occ: 18, status: "ON" },
    "Ruang Kelas 2.15": { temp: 25.4, humidity: 61.0, fan: "Low", occ: 7, status: "ON" },
    "Ruang Kelas 2.16": { temp: 26.1, humidity: 63.8, fan: "OFF", occ: 0, status: "OFF" },
    "Ruang Kelas 2.17": { temp: 24.7, humidity: 60.5, fan: "Low", occ: 10, status: "ON" },
    "Ruang Kelas 2.18": { temp: 23.9, humidity: 58.9, fan: "Medium", occ: 24, status: "ON" },
    "Ruang Kelas 2.19": { temp: 25.8, humidity: 62.7, fan: "Low", occ: 5, status: "ON" },
    "Ruang Kelas 2.20": { temp: 26.5, humidity: 64.5, fan: "OFF", occ: 0, status: "OFF" },
    "Ruang Kelas 2.35": { temp: 24.3, humidity: 59.6, fan: "Medium", occ: 16, status: "ON" },
    "Ruang Kelas 2.36": { temp: 25.0, humidity: 61.9, fan: "Low", occ: 11, status: "ON" },
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
      temp: base.temp + tempDelta,
      humidity: base.humidity + humidityDelta,
      occ: occupancy,
    };
  };

  const selectedDummyData =
    selectedRoom && selectedRoom.name !== IMPLEMENTED_ROOM
      ? getAnimatedDummyData(selectedRoom.name)
      : null;

  const isFreshData = (data) => {
    if (!data?.updated_at) return false;

    const updatedAt = new Date(data.updated_at).getTime();

    if (isNaN(updatedAt)) return false;

    return Date.now() - updatedAt <= DATA_FRESH_MS;
  };

  function getEffectiveRoomStatus(roomName) {
    if (roomName !== IMPLEMENTED_ROOM) {
      const dummyData = getAnimatedDummyData(roomName);

      if (dummyData?.status) {
        return dummyData.status;
      }
    }

    if (roomStatus[roomName]) {
      return roomStatus[roomName];
    }

    return undefined;
  }

  const selectedRoomIsOn = selectedRoom
    ? getEffectiveRoomStatus(selectedRoom.name) === "ON"
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

  useEffect(() => {
    const interval = setInterval(() => {
      setDummyTick((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatDateRealtime = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

    fetchSensorData();

    const interval = setInterval(fetchSensorData, 2000);

    return () => clearInterval(interval);
  }, []);

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
    if (!selectedRoom) return;

    fetchEnergySummary(
      {
        period: "day",
        date: new Date().toISOString().slice(0, 10),
      },
      setTodayEnergySummary,
    );
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentWeek = Math.min(Math.ceil(now.getDate() / 7), 4);
    const params =
      activeTab === "hari"
        ? {
            period: "day",
            date: now.toISOString().slice(0, 10),
          }
        : activeTab === "minggu"
          ? {
              period: "week",
              year: String(currentYear),
              month: String(currentMonth),
              week: String(currentWeek),
            }
          : {
              period: "month",
              year: String(currentYear),
              month: String(currentMonth),
            };

    fetchEnergySummary(params, setPeriodEnergySummary);
  }, [selectedRoom, activeTab]);

  // =========================
  // FORMAT DATA
  // =========================
  const formatTemperature = (value) => {
    if (!value) return "-";

    if (String(value).toUpperCase() === "OFF") {
      return "OFF";
    }

    return `${value}\u00B0C`;
  };

  const formatActualTemperature = (value) => {
    if (value === undefined || value === null) return "-";

    const numberValue = Number(value);

    if (isNaN(numberValue)) return "-";

    return `${numberValue.toFixed(1)}\u00B0C`;
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
    if (!isOn) return "-";

    return formatFanSpeed(value);
  };

  const getEnergyRoomSummary = (summary, roomName) => {
    return summary?.rooms?.find((room) => room.room_name === roomName) ?? null;
  };

  const formatEnergyValue = (value) => {
    if (typeof value !== "number") return "-";

    return `${value.toFixed(3)} kWh`;
  };

  const formatPowerValue = (value) => {
    if (typeof value !== "number") return "-";

    return `${value} W (Acuan)`;
  };

  const getDummyEnergyValue = (period) => {
    if (!selectedDummyData) return null;

    const seed = getRoomSeed(selectedRoom?.name ?? "");
    const occupancy = Number(selectedDummyData.occ ?? 0);
    const base =
      selectedDummyData.status === "OFF"
        ? 0.8 + (seed % 3) * 0.3
        : 6 + occupancy * 0.28 + (seed % 5);

    if (period === "minggu") return base * 6.4;
    if (period === "bulan") return base * 25.2;

    return base;
  };

  const todayEnergyRoom = selectedRoom
    ? getEnergyRoomSummary(todayEnergySummary, selectedRoom.name)
    : null;
  const periodEnergyRoom = selectedRoom
    ? getEnergyRoomSummary(periodEnergySummary, selectedRoom.name)
    : null;
  const todayEnergyValue =
    todayEnergyRoom?.total_energy_kwh ?? getDummyEnergyValue("hari");
  const periodEnergyValue =
    periodEnergyRoom?.total_energy_kwh ?? getDummyEnergyValue(activeTab);
  const periodAverageValue =
    activeTab === "hari"
      ? periodEnergyValue
      : typeof periodEnergyValue === "number"
        ? periodEnergyValue / (activeTab === "minggu" ? 7 : 30)
        : null;
  const currentPowerValue =
    todayEnergyRoom?.power_watt ?? periodEnergyRoom?.power_watt ?? 330;

  const hasFreshSensorData = selectedRoomIsOn && isFreshData(selectedSensorData);
  const hasYoloData = Boolean(selectedYoloData);

  const actualTemperatureDisplay = selectedDummyData
    ? formatActualTemperature(selectedDummyData.temp)
    : hasFreshSensorData
      ? formatActualTemperature(selectedSensorData?.temperature)
      : "-";
  const actualHumidityDisplay = selectedDummyData
    ? formatHumidity(selectedDummyData.humidity)
    : hasFreshSensorData
      ? formatHumidity(selectedSensorData?.humidity)
      : "-";
  const actualOccupancyDisplay = selectedDummyData
    ? formatOccupancy(selectedDummyData.occ)
    : selectedRoomIsOn && hasYoloData
      ? formatOccupancy(selectedYoloData?.occupancy)
      : "-";
  const actualFanSpeedDisplay = selectedDummyData
    ? formatFanSpeed(selectedDummyData.fan)
    : selectedRoomIsOn && hasYoloData
      ? formatFanSpeed(selectedYoloData?.applied_fan_speed)
      : "-";
  const yoloTemperatureDisplay = selectedDummyData
    ? formatActualTemperature(selectedDummyData.temp)
    : selectedRoomIsOn && hasYoloData
      ? formatTemperature(selectedYoloData?.temperature)
      : "-";
  const yoloOccupancyDisplay = selectedDummyData
    ? formatOccupancy(selectedDummyData.occ)
    : selectedRoomIsOn && hasYoloData
      ? formatOccupancy(selectedYoloData?.occupancy)
      : "-";
  const yoloFanSpeedDisplay = selectedDummyData
    ? formatFanSpeed(selectedDummyData.fan)
    : selectedRoomIsOn && hasYoloData
      ? formatFanSpeed(selectedYoloData?.fan_speed)
      : "-";
  const selectedLastUpdated =
    selectedDummyData
      ? currentDateTime.toISOString()
      : selectedYoloData?.updated_at || selectedSensorData?.updated_at;
  const hasSelectedRoomDetail = Boolean(
    selectedDummyData || selectedYoloData || selectedSensorData,
  );

  // =========================
  // DATA RUANGAN STATIC
  // =========================
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
        headers: apiHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }),
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

  return (
    <div className="app-shell" style={layout}>
      <Sidebar />

      {/* MAIN */}
      <MainLayout
        title="Kelola Ruangan"
        subtitle="Kelola ruang dan status AC secara real-time"
      >
        <div className="room-map-container" style={container}>
          <div style={titleBar}>Gedung Utama Lt. 2</div>

          <div style={{ padding: 20 }}>
            {data.map((floor, i) => (
              <div key={i} style={{ marginBottom: 25 }}>
                {floor.lantai && <h3 style={floorTitle}>{floor.lantai}</h3>}

                <div className="room-grid" style={grid}>
                  {floor.rooms.map((room, idx) => (
                    <RoomCard
                      key={idx}
                      room={room}
                      isOn={getEffectiveRoomStatus(room.name) === "ON"}
                      onOpen={() => setSelectedRoom(room)}
                    />
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
          <div className="room-modal responsive-modal" style={modal}>
            {/* CLOSE BUTTON */}
            <button
              className="modal-close-button"
              style={closeBtn}
              onClick={() => setSelectedRoom(null)}
            >
              ×
            </button>

            {/* MODAL HEADER */}
            <div className="modal-top" style={modalTop}>
              <div>
                <div className="room-modal-eyebrow" style={modalEyebrow}>
                  Detail Ruangan
                </div>
                <h2 className="room-modal-title" style={modalTitle}>
                  {selectedRoom.name}
                </h2>
                <p className="room-modal-subtitle" style={modalSubtitle}>
                  Detail monitoring dan kontrol manual AC ruangan
                </p>
              </div>

              <div
                className={`room-status-badge ${
                  getEffectiveRoomStatus(selectedRoom.name) === "ON"
                    ? "room-status-on"
                    : "room-status-off"
                }`}
                style={{
                  ...statusBadge,
                  background:
                    getEffectiveRoomStatus(selectedRoom.name) === "ON"
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(148, 163, 184, 0.15)",
                  color:
                    getEffectiveRoomStatus(selectedRoom.name) === "ON"
                      ? "#22c55e"
                      : "#e2e8f0",
                  border:
                    getEffectiveRoomStatus(selectedRoom.name) === "ON"
                      ? "1px solid #22c55e"
                      : "1px solid rgba(226, 232, 240, 0.35)",
                }}
              >
                Status:{" "}
                {getEffectiveRoomStatus(selectedRoom.name) === "ON"
                  ? "AC ON"
                  : "AC OFF"}
              </div>
            </div>

            {hasSelectedRoomDetail && (
              <div className="room-detail-meta" style={detailMetaCard}>
                <span>Terakhir diperbarui</span>
                <b>{formatDateTime(selectedLastUpdated)}</b>
              </div>
            )}

            {/* DATA SECTION */}
            <div className="modal-grid" style={modalGrid}>
              <div className="room-modal-panel" style={infoCard}>
                <div className="room-section-title" style={sectionTitle}>
                  Data Aktual
                </div>

                <div className="room-data-row" style={dataRow}>
                  <span>Temperature</span>
                  <b>{actualTemperatureDisplay}</b>
                </div>

                <div className="room-data-row" style={dataRow}>
                  <span>Humidity</span>
                  <b>{actualHumidityDisplay}</b>
                </div>

                <div className="room-data-row" style={dataRow}>
                  <span>Occupancy</span>
                  <b>{actualOccupancyDisplay}</b>
                </div>

                <div
                  className="room-data-row"
                  style={{ ...dataRow, borderBottom: "none" }}
                >
                  <span>Fan Speed</span>
                  <b>{actualFanSpeedDisplay}</b>
                </div>
              </div>

              <div className="room-modal-panel" style={infoCard}>
                <div className="room-section-title" style={sectionTitle}>
                  Rekomendasi YOLO
                </div>

                <div className="room-data-row" style={dataRow}>
                  <span>Temperature</span>
                  <b>{yoloTemperatureDisplay}</b>
                </div>

                <div className="room-data-row" style={dataRow}>
                  <span>Occupancy</span>
                  <b>{yoloOccupancyDisplay}</b>
                </div>

                <div
                  className="room-data-row"
                  style={{ ...dataRow, borderBottom: "none" }}
                >
                  <span>Fan Speed</span>
                  <b>{yoloFanSpeedDisplay}</b>
                </div>
              </div>
            </div>

            {/* ENERGY SECTION */}
            <div className="modal-grid" style={modalGrid}>
              <div className="room-modal-panel room-energy-card" style={energyCard}>
                <div style={energyCardHeader}>
                  <div style={energyTitleWrap}>
                    <div style={energyIconBox}>
                      <FaBolt />
                    </div>
                    <div>
                      <div className="room-energy-title" style={energyCardTitle}>
                        Used Energy Today
                      </div>
                      <div
                        className="room-energy-subtitle"
                        style={energyCardSubtitle}
                      >
                        Monitoring energi harian ruangan
                      </div>
                    </div>
                  </div>
                </div>

                <div style={dateTimeWrapper}>
                  <div className="room-date-card" style={dateTimeCard}>
                    <div className="room-date-label" style={dateTimeLabel}>
                      <FaCalendarAlt style={{ marginRight: 6 }} />
                      Tanggal
                    </div>
                    <div className="room-date-value" style={dateTimeValue}>
                      {formatDateRealtime(currentDateTime)}
                    </div>
                  </div>
                </div>

                <div style={miniGrid}>
                  <div className="room-energy-stat" style={energyStatCard}>
                    <span className="room-energy-stat-label" style={energyStatLabel}>
                      Daya AC
                    </span>
                    <b className="room-energy-stat-value" style={energyStatValue}>
                      {formatPowerValue(currentPowerValue)}
                    </b>
                  </div>

                  <div className="room-energy-stat" style={energyStatCard}>
                    <span className="room-energy-stat-label" style={energyStatLabel}>
                      Energi Hari Ini
                    </span>
                    <b className="room-energy-stat-value" style={energyStatValue}>
                      {formatEnergyValue(todayEnergyValue)}
                    </b>
                  </div>
                </div>
              </div>

              <div className="room-modal-panel room-energy-card" style={energyCard}>
                <div style={energyCardHeader}>
                  <div style={energyTitleWrap}>
                    <div style={energyIconBox}>
                      <FaChartLine />
                    </div>
                    <div>
                      <div className="room-energy-title" style={energyCardTitle}>
                        Used Energy Period
                      </div>
                      <div
                        className="room-energy-subtitle"
                        style={energyCardSubtitle}
                      >
                        Ringkasan penggunaan energi
                      </div>
                    </div>
                  </div>
                </div>

                <div style={tabContainer}>
                  <button
                    className={`room-modal-tab ${
                      activeTab === "hari" ? "room-modal-tab-active" : ""
                    }`}
                    style={
                      activeTab === "hari"
                        ? tabActive
                        : {
                            ...tab,
                            ...(hoveredEnergyTab === "hari" ? tabHover : {}),
                          }
                    }
                    onMouseEnter={() => setHoveredEnergyTab("hari")}
                    onMouseLeave={() => setHoveredEnergyTab("")}
                    onClick={() => setActiveTab("hari")}
                  >
                    Hari
                  </button>

                  <button
                    className={`room-modal-tab ${
                      activeTab === "minggu" ? "room-modal-tab-active" : ""
                    }`}
                    style={
                      activeTab === "minggu"
                        ? tabActive
                        : {
                            ...tab,
                            ...(hoveredEnergyTab === "minggu" ? tabHover : {}),
                          }
                    }
                    onMouseEnter={() => setHoveredEnergyTab("minggu")}
                    onMouseLeave={() => setHoveredEnergyTab("")}
                    onClick={() => setActiveTab("minggu")}
                  >
                    Minggu
                  </button>

                  <button
                    className={`room-modal-tab ${
                      activeTab === "bulan" ? "room-modal-tab-active" : ""
                    }`}
                    style={
                      activeTab === "bulan"
                        ? tabActive
                        : {
                            ...tab,
                            ...(hoveredEnergyTab === "bulan" ? tabHover : {}),
                          }
                    }
                    onMouseEnter={() => setHoveredEnergyTab("bulan")}
                    onMouseLeave={() => setHoveredEnergyTab("")}
                    onClick={() => setActiveTab("bulan")}
                  >
                    Bulan
                  </button>
                </div>

                <div style={miniGrid}>
                  <div className="room-energy-stat" style={energyStatCard}>
                    <span className="room-energy-stat-label" style={energyStatLabel}>
                      Total Energi
                    </span>
                    <b className="room-energy-stat-value" style={energyStatValue}>
                      {formatEnergyValue(periodEnergyValue)}
                    </b>
                  </div>

                  <div className="room-energy-stat" style={energyStatCard}>
                    <span className="room-energy-stat-label" style={energyStatLabel}>
                      Rata-rata per Hari
                    </span>
                    <b className="room-energy-stat-value" style={energyStatValue}>
                      {formatEnergyValue(periodAverageValue)}
                    </b>
                  </div>
                </div>

                <div className="room-period-info" style={periodInfoBox}>
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
            <div className="control-card" style={controlCard}>
              <div>
                <div className="room-section-title" style={sectionTitle}>
                  Kontrol Manual
                </div>
                <p className="room-control-text" style={controlText}>
                  Gunakan kontrol manual hanya saat ada kebutuhan di luar
                  jadwal. Semua tindakan wajib menyertakan alasan dan akan
                  tercatat di audit log.
                </p>
              </div>

              <div style={controlButtons}>
                <button
                  className="manual-control-button manual-control-on"
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
                  className="manual-control-button manual-control-off"
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
                <div className="reason-box" style={reasonBox}>
                  <h3 style={reasonTitle}>
                    Konfirmasi AC {pendingCommand}
                  </h3>

                  <p style={reasonSubtitle}>
                    Ruangan: <b>{selectedRoom?.name}</b>
                  </p>

                  <div className="reason-warning-box" style={reasonWarningBox}>
                    {pendingCommand === "ON"
                      ? "Anda akan menyalakan AC ke 24°C dan YOLO akan langsung aktif untuk ruangan ini."
                      : "Anda akan mematikan AC dan YOLO akan dinonaktifkan sampai ada jadwal berikutnya atau perintah manual ON."}
                  </div>

                  <textarea
                    className="reason-textarea"
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
                      className="reason-button reason-button-cancel"
                      style={reasonCancelBtn}
                      disabled={controlLoading}
                      onClick={closeReasonModal}
                    >
                      Batal
                    </button>

                    <button
                      className="reason-button reason-button-submit"
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
  background: "rgba(2, 8, 23, 0.78)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  backdropFilter: "blur(8px)",
};

const modal = {
  width: "960px",
  maxWidth: "92vw",
  maxHeight: "92vh",
  overflowY: "auto",
  background:
    "radial-gradient(circle at top left, rgba(45, 140, 255, 0.13), transparent 34%), linear-gradient(145deg, rgba(17, 34, 58, 0.99), rgba(8, 17, 34, 0.99))",
  color: "var(--text-main, #111)",
  borderRadius: 18,
  padding: 26,
  position: "relative",
  boxShadow: "0 30px 90px rgba(0,0,0,0.48)",
  border: "1px solid rgba(96, 165, 250, 0.22)",
  transition: "0.2s ease",
};

const closeBtn = {
  position: "absolute",
  top: 18,
  right: 18,
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.5)",
  color: "#f8fafc",
  fontSize: 20,
  lineHeight: "24px",
  cursor: "pointer",
  zIndex: 2,
};

const modalTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 20,
  padding: "20px 22px",
  borderRadius: 16,
  background:
    "linear-gradient(145deg, rgba(28, 47, 77, 0.96), rgba(16, 31, 56, 0.98))",
  color: "#fff",
  border: "1px solid rgba(96, 165, 250, 0.28)",
  boxShadow: "0 18px 42px rgba(2, 8, 23, 0.24)",
};

const modalEyebrow = {
  marginBottom: 6,
  color: "#93c5fd",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const modalTitle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: 0,
};

const modalSubtitle = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "rgba(255,255,255,0.82)",
};

const statusBadge = {
  padding: "9px 13px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const detailMetaCard = {
  marginBottom: 16,
  padding: "13px 15px",
  borderRadius: 12,
  border: "1px solid rgba(96, 165, 250, 0.22)",
  background: "rgba(45, 140, 255, 0.11)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  color: "var(--text-main, #f8fafc)",
  fontSize: 13,
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 16,
};

const infoCard = {
  background:
    "linear-gradient(145deg, rgba(43, 60, 90, 0.98), rgba(30, 43, 66, 0.98))",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 14,
  color: "#f8fafc",
};

const dataRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "9px 0",
  borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
  fontSize: 13,
  color: "#cbd5e1",
};

const energyCard = {
  background:
    "linear-gradient(145deg, rgba(43, 60, 90, 0.98), rgba(30, 43, 66, 0.98))",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: 16,
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
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
  background: "linear-gradient(135deg, #2d8cff, #1a6ed8)",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: 16,
};

const energyCardTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#f8fafc",
};

const energyCardSubtitle = {
  fontSize: 12,
  color: "#cbd5e1",
  marginTop: 2,
};

const dateTimeWrapper = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
};

const dateTimeCard = {
  background: "rgba(15, 23, 42, 0.28)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: 12,
  padding: "12px 14px",
};

const dateTimeLabel = {
  fontSize: 12,
  color: "#cbd5e1",
  display: "flex",
  alignItems: "center",
  marginBottom: 6,
};

const dateTimeValue = {
  fontSize: 13,
  fontWeight: 700,
  color: "#f8fafc",
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const energyStatCard = {
  background: "rgba(15, 23, 42, 0.3)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: 14,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const energyStatLabel = {
  fontSize: 12,
  color: "#cbd5e1",
};

const energyStatValue = {
  fontSize: 20,
  fontWeight: 800,
  color: "#f8fafc",
};

const periodInfoBox = {
  fontSize: 12,
  color: "#cbd5e1",
  background: "rgba(45, 140, 255, 0.08)",
  border: "1px solid rgba(45, 140, 255, 0.2)",
  padding: "10px 12px",
  borderRadius: 10,
};

const tabContainer = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 8,
};

const tab = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.3)",
  color: "#e2e8f0",
  padding: 8,
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  transition: "0.18s ease",
};

const tabHover = {
  background: "rgba(45, 140, 255, 0.18)",
  color: "#bfdbfe",
  border: "1px solid rgba(96, 165, 250, 0.48)",
  transform: "translateY(-1px)",
  boxShadow: "0 10px 18px rgba(45, 140, 255, 0.12)",
};

const tabActive = {
  ...tab,
  background: "#2d8cff",
  color: "#fff",
  border: "1px solid #2d8cff",
  boxShadow: "0 10px 18px rgba(45, 140, 255, 0.16)",
};

const controlCard = {
  background:
    "linear-gradient(145deg, rgba(45, 64, 94, 0.98), rgba(28, 42, 66, 0.98))",
  border: "1px solid rgba(96, 165, 250, 0.2)",
  borderRadius: 16,
  padding: 20,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const controlText = {
  margin: 0,
  fontSize: 12,
  color: "#cbd5e1",
  maxWidth: 520,
};

const controlButtons = {
  display: "flex",
  gap: 8,
};

const btnOn = {
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#fff",
  border: "1px solid rgba(134, 239, 172, 0.22)",
  padding: "12px 20px",
  borderRadius: 12,
  fontWeight: 800,
  boxShadow: "0 12px 24px rgba(34, 197, 94, 0.2)",
};

const btnOff = {
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "#fff",
  border: "1px solid rgba(252, 165, 165, 0.22)",
  padding: "12px 20px",
  borderRadius: 12,
  fontWeight: 800,
  boxShadow: "0 12px 24px rgba(239, 68, 68, 0.18)",
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

const reasonWarningBox = {
  background: "rgba(245, 158, 11, 0.12)",
  border: "1px solid rgba(245, 158, 11, 0.35)",
  color: "var(--text-main, #111)",
  borderRadius: 12,
  padding: 12,
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 14,
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

