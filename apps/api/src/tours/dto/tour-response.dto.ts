import { TourDifficulty, TourStatus } from '../../generated/prisma/enums';

export class TourResponseDto {
  id: number;
  partnerId: number | null;
  name: string | null;
  slug: string | null;
  durationDays: number | null;
  maxGroupSize: number | null;
  minBookingSize: number | null;
  difficulty: TourDifficulty | null;
  price: number | null;
  currency: string | null;
  summary: string | null;
  description: any | null;
  createdAt: Date | null;
  status: TourStatus | null;
  createdBy: string | null;
  updatedAt: Date | null;
  isDeleted: boolean | null;
  partner?: {
    id: number;
    name: string | null;
  };
  tourMedia?: {
    id: number;
    url: string | null;
    isCover: boolean | null;
  }[];
  tourSchedules?: {
    id: number;
    startDate: Date | null;
    seatsAvailable: number | null;
  }[];
}