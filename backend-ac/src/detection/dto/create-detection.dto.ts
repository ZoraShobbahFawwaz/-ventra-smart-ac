export class CreateDetectionDto {
  room_name!: string;
  temperature!: string;
  fan_speed!: string;
  occupancy?: number;
}