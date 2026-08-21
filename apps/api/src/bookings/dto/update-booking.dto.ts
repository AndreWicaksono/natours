import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../../generated/prisma/enums';

export class UpdateBookingDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}