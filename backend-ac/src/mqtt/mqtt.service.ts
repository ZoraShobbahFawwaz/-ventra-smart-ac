import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as mqtt from 'mqtt';
import { Repository } from 'typeorm';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';
import { AuditService } from '../audit/audit.service';
import { EnergyService } from '../energy/energy.service';

type SensorData = {
  room: string;
  temperature: number;
  humidity: number;
  updated_at: string;
};

type AcLogPayload = {
  room?: string;
  room_name?: string;
  power?: string;
  command?: string;
  temp?: number | string | null;
  temperature?: number | string | null;
  setpoint?: number | string | null;
  fan?: string | null;
  fan_speed?: string | null;
  source?: string;
  timestamp?: string;
  event_type?: string;
  suhu_aktual?: number | string | null;
  humidity?: number | string | null;
};

type TemperatureAlert = {
  id: string;
  room_name: string;
  type: 'temperature_rising_while_on' | 'temperature_dropping_while_off';
  severity: 'warning';
  power: 'ON' | 'OFF';
  title: string;
  message: string;
  set_temperature: number | null;
  reference_temperature: number;
  actual_temperature: number;
  delta_temperature: number;
  event_time: string;
  source: string;
};

type TemperatureState = {
  power: 'ON' | 'OFF';
  referenceActualTemperature: number;
  setTemperature: number | null;
};

@Injectable()
export class MqttService implements OnModuleInit {
  private client!: mqtt.MqttClient;
  private isConnected = false;

  private readonly brokerUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
  private readonly temperatureAlertLookbackHours = Number(
    process.env.AC_TEMP_ALERT_LOOKBACK_HOURS || 2,
  );
  private readonly temperatureAlertDeltaThreshold = Number(
    process.env.AC_TEMP_ALERT_DELTA_THRESHOLD || 1,
  );
  private readonly temperatureAlertSetpointTolerance = Number(
    process.env.AC_TEMP_ALERT_SETPOINT_TOLERANCE || 1,
  );
  private readonly temperatureAlertLimit = Number(
    process.env.AC_TEMP_ALERT_LIMIT || 5,
  );

  private latestSensorData: Record<string, SensorData> = {};

  constructor(
    @InjectRepository(AcIotEvent)
    private readonly acIotEventRepo: Repository<AcIotEvent>,
    private readonly auditService: AuditService,
    private readonly energyService: EnergyService,
  ) {}

  onModuleInit() {
    this.client = mqtt.connect(this.brokerUrl, {
      clientId: `backend-ac-${Date.now()}`,
      clean: true,
      reconnectPeriod: 2000,
      connectTimeout: 5000,
      keepalive: 60,
      protocolVersion: 4,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log(`✅ [MQTT] Connected to broker: ${this.brokerUrl}`);

      this.client.subscribe('room/sensor', (err) => {
        if (err) {
          console.log('❌ Gagal subscribe room/sensor:', err.message);
        } else {
          console.log('📡 Subscribed to room/sensor');
        }
      });

      this.client.subscribe('ac/log', (err) => {
        if (err) {
          console.log('❌ Gagal subscribe ac/log:', err.message);
        } else {
          console.log('📡 Subscribed to ac/log');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString();

      console.log(`📩 [MQTT RECEIVED] ${topic}: ${payload}`);

      if (topic === 'room/sensor') {
        this.handleSensorData(payload);
      }

      if (topic === 'ac/log') {
        void this.handleAcLog(payload);
      }
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      console.log('❌ [MQTT] Error:', err.message);
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      console.log('⚠️ [MQTT] Offline...');
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('⚠️ [MQTT] Connection closed');
    });

    this.client.on('reconnect', () => {
      console.log('🔄 [MQTT] Reconnecting...');
    });
  }

  publish(topic: string, data: any) {
    if (!this.client || !this.isConnected) {
      console.log('⚠️ MQTT belum terhubung, gagal kirim');
      return;
    }

    const normalizedData =
      topic === 'ac/control' &&
      data?.temperature !== undefined &&
      data?.temp === undefined
        ? { ...data, temp: data.temperature }
        : data;

    const payload = JSON.stringify(normalizedData);

    this.client.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) {
        console.log('❌ [MQTT] Publish error:', err.message);
      } else {
        console.log(`📡 [MQTT SENT] ${topic} -> ${payload}`);
      }
    });
  }

  private handleSensorData(payload: string) {
    try {
      const data = JSON.parse(payload) as {
        room?: string;
        temperature?: number;
        humidity?: number;
      };

      if (!data.room) {
        console.log('⚠️ Data sensor tidak memiliki room:', data);
        return;
      }

      const temperature = Number(data.temperature);
      const humidity = Number(data.humidity);

      if (isNaN(temperature) || isNaN(humidity)) {
        console.log('⚠️ Data temperature/humidity tidak valid:', data);
        return;
      }

      this.latestSensorData[data.room] = {
        room: data.room,
        temperature,
        humidity,
        updated_at: new Date().toISOString(),
      };

      console.log(
        `✅ Sensor updated: ${data.room} | Temperature: ${temperature}°C | Humidity: ${humidity}%`,
      );
    } catch {
      console.log('❌ Gagal parsing data sensor MQTT:', payload);
    }
  }

  private async handleAcLog(payload: string) {
    try {
      const data = JSON.parse(payload) as AcLogPayload;
      const roomName = (data.room ?? data.room_name ?? '').trim();
      const eventType = String(data.event_type ?? 'unknown').trim();

      const power = String(data.power ?? data.command ?? '')
        .trim()
        .toUpperCase();

      if (!roomName) {
        console.log('Feedback AC tidak memiliki room:', data);
        return;
      }

      if (power !== 'ON' && power !== 'OFF') {
        console.log('Feedback AC power tidak valid:', data);
        return;
      }

      const temperatureValue = data.temperature ?? data.temp ?? data.setpoint;
      const fanValue = data.fan_speed ?? data.fan;
      const actualTemperature = this.toNullableNumber(data.suhu_aktual);
      const humidity = this.toNullableNumber(data.humidity);
      const temperature =
        power === 'OFF' || temperatureValue === null
          ? null
          : Number(temperatureValue);
      const fanSpeed =
        power === 'OFF' || fanValue === null
          ? null
          : this.normalizeFanSpeed(fanValue);

      if (temperature !== null && isNaN(temperature)) {
        console.log('Feedback AC temperature tidak valid:', data);
        return;
      }

      if (power === 'ON' && !fanSpeed) {
        console.log('Feedback AC fan_speed tidak valid:', data);
        return;
      }

      const event = this.acIotEventRepo.create({
        roomName,
        eventTime: this.getEventTime(data.timestamp),
        eventType,
        power,
        temperature,
        actualTemperature,
        humidity,
        fanSpeed,
        source: this.normalizeSource(data.source),
      });

      const savedEvent = await this.acIotEventRepo.save(event);
      await this.energyService.recordAcEvent(savedEvent);
      await this.recordTemperatureAlertAudit(savedEvent);

      console.log(
        `AC event saved: ${roomName} | ${eventType} | ${power} | ${temperature ?? 'NULL'} | ${fanSpeed ?? 'NULL'} | ${event.source}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        console.log('Gagal simpan feedback AC:', error.message);
      } else {
        console.log('Gagal simpan feedback AC:', error);
      }
    }
  }

  async getTemperatureAlerts() {
    const since = new Date(
      Date.now() - this.temperatureAlertLookbackHours * 60 * 60 * 1000,
    );
    const events = await this.acIotEventRepo
      .createQueryBuilder('event')
      .where('event.actual_temperature IS NOT NULL')
      .andWhere('event.event_time >= :since', { since })
      .orderBy('event.room_name', 'ASC')
      .addOrderBy('event.event_time', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .getMany();

    const alerts = this.buildTemperatureAlerts(events)
      .sort(
        (a, b) =>
          new Date(b.event_time).getTime() - new Date(a.event_time).getTime(),
      )
      .slice(0, this.temperatureAlertLimit);

    return {
      generated_at: new Date().toISOString(),
      lookback_hours: this.temperatureAlertLookbackHours,
      delta_threshold_celsius: this.temperatureAlertDeltaThreshold,
      alerts,
    };
  }

  private async recordTemperatureAlertAudit(event: AcIotEvent) {
    if (event.actualTemperature === null) {
      return;
    }

    const since = new Date(
      Date.now() - this.temperatureAlertLookbackHours * 60 * 60 * 1000,
    );
    const events = await this.acIotEventRepo
      .createQueryBuilder('event')
      .where('event.room_name = :roomName', { roomName: event.roomName })
      .andWhere('event.actual_temperature IS NOT NULL')
      .andWhere('event.event_time >= :since', { since })
      .orderBy('event.event_time', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .getMany();
    const alert = this.buildTemperatureAlerts(events).find((item) =>
      item.id.startsWith(`${event.id}-`),
    );

    if (!alert) {
      return;
    }

    await this.auditService.createLog({
      user: 'System',
      action: 'Notify',
      module: 'AC Monitoring',
      subject: `${alert.title} (${alert.room_name})`,
      oldValue: {
        power: alert.power,
        reference_temperature: alert.reference_temperature,
        set_temperature: alert.set_temperature,
      },
      newValue: {
        actual_temperature: alert.actual_temperature,
        delta_temperature: alert.delta_temperature,
        source: alert.source,
        event_time: alert.event_time,
        message: alert.message,
      },
      status: 'success',
    });
  }

  private buildTemperatureAlerts(events: AcIotEvent[]) {
    const roomStates = new Map<string, TemperatureState>();
    const latestAlertsByKey = new Map<string, TemperatureAlert>();

    events.forEach((event) => {
      if (event.actualTemperature === null) {
        return;
      }

      const actualTemperature = this.roundTemperature(
        event.actualTemperature,
      );
      const currentState = roomStates.get(event.roomName);

      if (!currentState || currentState.power !== event.power) {
        roomStates.set(event.roomName, {
          power: event.power,
          referenceActualTemperature: actualTemperature,
          setTemperature: event.temperature,
        });
        return;
      }

      if (event.temperature !== null) {
        currentState.setTemperature = event.temperature;
      }

      if (event.power === 'ON') {
        if (actualTemperature < currentState.referenceActualTemperature) {
          currentState.referenceActualTemperature = actualTemperature;
          return;
        }

        const delta = this.roundTemperature(
          actualTemperature - currentState.referenceActualTemperature,
        );
        const setTemperature = currentState.setTemperature;
        const isAboveSetpoint =
          setTemperature !== null &&
          actualTemperature >
            setTemperature + this.temperatureAlertSetpointTolerance;

        if (delta >= this.temperatureAlertDeltaThreshold && isAboveSetpoint) {
          const alert = this.createTemperatureAlert(
            event,
            'temperature_rising_while_on',
            currentState.referenceActualTemperature,
            actualTemperature,
            delta,
            setTemperature,
          );

          latestAlertsByKey.set(`${event.roomName}-${alert.type}`, alert);
        }

        return;
      }

      if (actualTemperature > currentState.referenceActualTemperature) {
        currentState.referenceActualTemperature = actualTemperature;
        return;
      }

      const delta = this.roundTemperature(
        currentState.referenceActualTemperature - actualTemperature,
      );

      if (delta >= this.temperatureAlertDeltaThreshold) {
        const alert = this.createTemperatureAlert(
          event,
          'temperature_dropping_while_off',
          currentState.referenceActualTemperature,
          actualTemperature,
          delta,
          null,
        );

        latestAlertsByKey.set(`${event.roomName}-${alert.type}`, alert);
      }
    });

    return Array.from(latestAlertsByKey.values());
  }

  private createTemperatureAlert(
    event: AcIotEvent,
    type: TemperatureAlert['type'],
    referenceTemperature: number,
    actualTemperature: number,
    deltaTemperature: number,
    setTemperature: number | null,
  ): TemperatureAlert {
    const isOnAlert = type === 'temperature_rising_while_on';
    const title = isOnAlert
      ? 'Suhu aktual naik saat AC ON'
      : 'Suhu aktual turun saat AC OFF';
    const message = isOnAlert
      ? `${event.roomName}: AC diset ${setTemperature}C, tetapi suhu aktual naik dari ${referenceTemperature}C ke ${actualTemperature}C.`
      : `${event.roomName}: AC tercatat OFF, tetapi suhu aktual turun dari ${referenceTemperature}C ke ${actualTemperature}C.`;

    return {
      id: `${event.id}-${type}`,
      room_name: event.roomName,
      type,
      severity: 'warning',
      power: event.power,
      title,
      message,
      set_temperature: setTemperature,
      reference_temperature: referenceTemperature,
      actual_temperature: actualTemperature,
      delta_temperature: deltaTemperature,
      event_time: event.eventTime.toISOString(),
      source: event.source,
    };
  }

  private roundTemperature(value: number) {
    return Math.round(value * 10) / 10;
  }

  private normalizeFanSpeed(value: string | number | null | undefined) {
    const fanSpeed = String(value ?? '').trim().toUpperCase();

    if (fanSpeed === 'LOW' || fanSpeed === 'MEDIUM' || fanSpeed === 'HIGH') {
      return fanSpeed;
    }

    return null;
  }

  private normalizeSource(value: string | undefined) {
    const source = String(value ?? 'esp32').trim();

    return source || 'esp32';
  }

  private toNullableNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);

    return isNaN(numberValue) ? null : numberValue;
  }

  private getEventTime(timestamp: string | undefined) {
    if (!timestamp) {
      return new Date();
    }

    const eventTime = new Date(timestamp);

    if (isNaN(eventTime.getTime())) {
      return new Date();
    }

    return eventTime;
  }

  getLatestSensorData() {
    return this.latestSensorData;
  }

  getSensorByRoom(roomName: string) {
    return this.latestSensorData[roomName] ?? null;
  }
}
