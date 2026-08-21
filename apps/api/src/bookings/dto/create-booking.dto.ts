import { IsInt, IsPositive, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  tourScheduleId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  tourId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  startLocationId?: number;

  @IsInt()
  @IsPositive()
  seatsBooked: number;
}