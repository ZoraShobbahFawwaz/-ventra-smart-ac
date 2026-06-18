import { RoomRuntimeService } from './room-runtime.service';

describe('RoomRuntimeService', () => {
  it('keeps YOLO enabled after OFF and allows ON again during schedule', () => {
    const service = new RoomRuntimeService();
    const roomName = 'Lab. Basic Electronics';

    service.activateBySchedule(roomName);
    service.recordYoloCommandSent(roomName, { power: 'off' });

    expect(service.getRoomState(roomName)).toMatchObject({
      ac_status: 'OFF',
      yolo_enabled: true,
      source: 'schedule',
      last_command: {
        power: 'off',
        sent_by: 'yolo',
      },
    });

    const onCommand = {
      power: 'on' as const,
      temperature: 24,
      fan: 'low',
    };

    expect(service.shouldSendCommand(roomName, onCommand)).toBe(true);

    service.recordYoloCommandSent(roomName, onCommand);

    expect(service.getRoomState(roomName)).toMatchObject({
      ac_status: 'ON',
      yolo_enabled: true,
      source: 'schedule',
      last_command: {
        power: 'on',
        temperature: 24,
        fan: 'low',
        sent_by: 'yolo',
      },
    });
  });

  it('does not record a YOLO command when the YOLO session is disabled', () => {
    const service = new RoomRuntimeService();

    expect(
      service.recordYoloCommandSent('Lab. Basic Electronics', {
        power: 'off',
      }),
    ).toBe(false);
    expect(service.getRoomState('Lab. Basic Electronics')).toBeNull();
  });
});
