import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

type SensorData = {
  room: string;
  temperature: number;
  humidity: number;
  updated_at: string;
};

@Injectable()
export class MqttService implements OnModuleInit {
  private client!: mqtt.MqttClient;
  private isConnected = false;

  private readonly brokerUrl = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';

  private latestSensorData: Record<string, SensorData> = {};

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

      this.client.subscribe('ac/feedback', (err) => {
        if (err) {
          console.log('❌ Gagal subscribe ac/feedback:', err.message);
        } else {
          console.log('📡 Subscribed to ac/feedback');
        }
      });

      this.client.subscribe('lab/sensor', (err) => {
        if (err) {
          console.log('❌ Gagal subscribe lab/sensor:', err.message);
        } else {
          console.log('📡 Subscribed to lab/sensor');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString();

      console.log(`📩 [MQTT RECEIVED] ${topic}: ${payload}`);

      if (topic === 'lab/sensor') {
        this.handleSensorData(payload);
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

    const payload = JSON.stringify(data);

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

  getLatestSensorData() {
    return this.latestSensorData;
  }

  getSensorByRoom(roomName: string) {
    return this.latestSensorData[roomName] ?? null;
  }
}
