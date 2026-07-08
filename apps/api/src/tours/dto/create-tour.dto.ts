import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsBoolean,
  IsJSON,
} from 'class-validator';
import { TourDifficulty, TourStatus } from '../../generated/prisma/enums';
import { Type } from 'class-transformer';

export class CreateTourDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationDays: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxGroupSize: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  minBookingSize?: number = 1;

  @IsEnum(TourDifficulty)
  difficulty: TourDifficulty;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsString()
  @IsOptional()
  summary?: string;

  @IsOptional()
  description?: any; // JSONB field

  @IsEnum(TourStatus)
  @IsOptional()
  status?: TourStatus = TourStatus.DRAFT;
}