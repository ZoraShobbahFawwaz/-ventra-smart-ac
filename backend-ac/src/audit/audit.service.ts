import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

// =========================
// TYPE UNTUK AUDIT LOG
// =========================
type AuditLogData = {
  user?: string;
  action: string;
  module: string;
  subject: string;
  oldValue?: unknown;
  newValue?: unknown;
  status?: 'success' | 'failed' | string;
};

@Injectable()
export class AuditService {
  constructor(private readonly dataSource: DataSource) {}

  // =========================
  // SAFE JSON STRINGIFY
  // =========================
  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value ?? null);
    } catch {
      return JSON.stringify(null);
    }
  }

  // =========================
  // CREATE LOG
  // =========================
  async createLog(data: AuditLogData) {
    const userName = data.user || 'Unknown';
    const status = data.status || 'success';

    await this.dataSource.query(
      `
      INSERT INTO audit_logs 
      (user_name, action, module, subject, old_value, new_value, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userName,
        data.action,
        data.module,
        data.subject,
        this.safeStringify(data.oldValue),
        this.safeStringify(data.newValue),
        status,
      ],
    );

    return {
      message: 'Audit log berhasil dicatat',
      status,
    };
  }

  // =========================
  // GET ALL LOGS
  // =========================
  async getAllLogs() {
    const logs = await this.dataSource.query(`
      SELECT *
      FROM audit_logs
      ORDER BY created_at DESC
    `);

    return logs.map((log: any) => ({
      ...log,
      old_value: this.safeParse(log.old_value),
      new_value: this.safeParse(log.new_value),
    }));
  }

  // =========================
  // SAFE JSON PARSE
  // =========================
  private safeParse(value: unknown) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}