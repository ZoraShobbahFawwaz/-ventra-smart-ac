import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as mqtt from 'mqtt';
import { Repository } from 'typeorm';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';

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

@Injectable()
export class MqttService implements OnModuleInit {
  private client!: mqtt.MqttClient;
  private isConnected = false;

  private readonly brokerUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';

  private latestSensorData: Record<string, SensorData> = {};

  constructor(
    @InjectRepository(AcIotEvent)
    private readonly acIotEventRepo: Repository<AcIotEvent>,
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

      this.client.subscribe('lab/sensor', (err) => {
        if (err) {
          console.log('❌ Gagal subscribe lab/sensor:', err.message);
        } else {
          console.log('📡 Subscribed to lab/sensor');
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

      if (topic === 'lab/sensor') {
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

      await this.acIotEventRepo.save(event);

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
