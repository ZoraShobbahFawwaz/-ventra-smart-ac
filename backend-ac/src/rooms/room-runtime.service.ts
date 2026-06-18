import { Injectable } from '@nestjs/common';

type ActivationSource = 'manual' | 'schedule' | 'schedule-pre';

type AcCommand =
  | {
      power: 'on';
      temperature: number;
      fan: string;
    }
  | {
      power: 'off';
    };

type LastAcCommand = AcCommand & {
  sent_by: string;
  updated_at: string;
};

type ManualOffOverride = {
  active: boolean;
  updated_at: string;
};

type RoomRuntimeState = {
  ac_status: 'ON' | 'OFF';
  yolo_enabled: boolean;
  source?: ActivationSource;
  updated_at: string;
  last_command?: LastAcCommand;
  manual_off_override?: ManualOffOverride;
};

@Injectable()
export class RoomRuntimeService {
  private roomStates: Record<string, RoomRuntimeState> = {};

  activateByManual(roomName: string) {
    const previousState = this.roomStates[roomName];

    this.roomStates[roomName] = {
      ...(previousState ?? {}),
      ac_status: 'ON',
      yolo_enabled: true,
      source: 'manual',
      updated_at: new Date().toISOString(),
      manual_off_override: undefined,
    };

    console.log(`✅ MANUAL ON -> YOLO ENABLED: ${roomName}`);
  }

  activateBySchedule(roomName: string) {
    const previousState = this.roomStates[roomName];

    this.roomStates[roomName] = {
      ...(previousState ?? {}),
      ac_status: 'ON',
      yolo_enabled: true,
      source: 'schedule',
      updated_at: new Date().toISOString(),
    };

    console.log(`✅ SCHEDULE ACTIVE -> YOLO ENABLED: ${roomName}`);
  }

  activateBySchedulePre(roomName: string) {
    const previousState = this.roomStates[roomName];

    this.roomStates[roomName] = {
      ...(previousState ?? {}),
      ac_status: 'ON',
      yolo_enabled: false,
      source: 'schedule-pre',
      updated_at: new Date().toISOString(),
    };

    console.log(`SCHEDULE PRE ON -> YOLO WAITING: ${roomName}`);
  }

  deactivate(roomName: string) {
    const previousState = this.roomStates[roomName];

    this.roomStates[roomName] = {
      ac_status: 'OFF',
      yolo_enabled: false,
      updated_at: new Date().toISOString(),
      last_command: previousState?.last_command,
      manual_off_override: undefined,
    };

    console.log(`🛑 YOLO DISABLED: ${roomName}`);
  }

  deactivateByManual(roomName: string) {
    const previousState = this.roomStates[roomName];
    const now = new Date().toISOString();

    this.roomStates[roomName] = {
      ac_status: 'OFF',
      yolo_enabled: false,
      source: 'manual',
      updated_at: now,
      last_command: previousState?.last_command,
      manual_off_override: {
        active: true,
        updated_at: now,
      },
    };

    console.log(`MANUAL OFF OVERRIDE ACTIVE: ${roomName}`);
  }

  clearManualOffOverride(roomName: string) {
    const previousState = this.roomStates[roomName];

    if (!previousState?.manual_off_override?.active) {
      return;
    }

    this.roomStates[roomName] = {
      ...previousState,
      manual_off_override: undefined,
      updated_at: new Date().toISOString(),
    };

    console.log(`MANUAL OFF OVERRIDE CLEARED: ${roomName}`);
  }

  isManualOffOverrideActive(roomName: string): boolean {
    return this.roomStates[roomName]?.manual_off_override?.active === true;
  }

  isYoloEnabled(roomName: string): boolean {
    return this.roomStates[roomName]?.yolo_enabled === true;
  }

  getRoomState(roomName: string) {
    return this.roomStates[roomName] ?? null;
  }

  getAllStates() {
    return this.roomStates;
  }

  getAppliedAcState(roomName: string) {
    const state = this.roomStates[roomName];
    const lastCommand = state?.last_command;

    if (!state) {
      return {
        ac_status: 'OFF',
        yolo_enabled: false,
        runtime_source: null,
        applied_power: 'off',
        applied_temperature: null,
        applied_fan_speed: null,
      };
    }

    if (state.ac_status !== 'ON' || lastCommand?.power !== 'on') {
      return {
        ac_status: state.ac_status,
        yolo_enabled: state.yolo_enabled,
        runtime_source: state.source ?? null,
        applied_power: 'off',
        applied_temperature: null,
        applied_fan_speed: null,
      };
    }

    return {
      ac_status: state.ac_status,
      yolo_enabled: state.yolo_enabled,
      runtime_source: state.source ?? null,
      applied_power: 'on',
      applied_temperature: lastCommand.temperature,
      applied_fan_speed: lastCommand.fan,
    };
  }

  shouldSendCommand(roomName: string, command: AcCommand): boolean {
    const lastCommand = this.roomStates[roomName]?.last_command;

    if (!lastCommand) {
      return true;
    }

    const normalizedCommand = this.normalizeCommand(command);
    const normalizedLastCommand = this.normalizeCommand(lastCommand);

    if (normalizedCommand.power !== normalizedLastCommand.power) {
      return true;
    }

    if (normalizedCommand.power === 'off') {
      return false;
    }

    if (normalizedLastCommand.power !== 'on') {
      return true;
    }

    return (
      normalizedCommand.temperature !== normalizedLastCommand.temperature ||
      normalizedCommand.fan !== normalizedLastCommand.fan
    );
  }

  recordCommandSent(roomName: string, command: AcCommand, sentBy: string) {
    this.saveCommandState(roomName, command, sentBy);
  }

  recordYoloCommandSent(roomName: string, command: AcCommand) {
    const previousState = this.roomStates[roomName];

    if (!previousState?.yolo_enabled) {
      return false;
    }

    this.saveCommandState(roomName, command, 'yolo', true);
    return true;
  }

  private saveCommandState(
    roomName: string,
    command: AcCommand,
    sentBy: string,
    preserveYoloSession = false,
  ) {
    const now = new Date().toISOString();
    const previousState = this.roomStates[roomName];
    const normalizedCommand = this.normalizeCommand(command);

    this.roomStates[roomName] = {
      ac_status: normalizedCommand.power === 'on' ? 'ON' : 'OFF',
      yolo_enabled: preserveYoloSession
        ? true
        : (previousState?.yolo_enabled ?? false),
      source: previousState?.source,
      updated_at: now,
      manual_off_override: previousState?.manual_off_override,
      last_command: {
        ...normalizedCommand,
        sent_by: sentBy,
        updated_at: now,
      },
    };
  }

  private normalizeCommand(command: AcCommand): AcCommand {
    if (command.power === 'off') {
      return { power: 'off' };
    }

    return {
      power: 'on',
      temperature: Number(command.temperature),
      fan: command.fan.toLowerCase(),
    };
  }
}
