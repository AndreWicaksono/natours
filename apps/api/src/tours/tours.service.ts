import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { UserPayload } from '../auth/user-payload.interface';
import { AppRole, TourStatus } from '../generated/prisma/enums';

@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new tour.
   * Only ADMIN or PARTNER_ADMIN can create tours.
   */
  async create(user: UserPayload, dto: CreateTourDto) {
    // Check role
    if (![AppRole.ADMIN, AppRole.PARTNER_ADMIN].includes(user.role as any))  {
      throw new ForbiddenException('Insufficient permissions to create a tour.');
    }

    // If not ADMIN, the tour must belong to the user's partner
    let partnerId: number | null = null;
    if (user.role === AppRole.ADMIN) {
      // Admin can assign any partner or leave it null
      partnerId = null; // Will be set by the frontend if needed
    } else {
      // Partner admin can only create tours for their own partner
      if (!user.partnerId) {
        throw new ForbiddenException('You are not associated with a partner.');
      }
      partnerId = user.partnerId;
    }

    // Check if slug already exists
    const existingTour = await this.prisma.tour.findUnique({
      where: { slug: dto.slug },
    });
    if (existingTour) {
      throw new BadRequestException(`Tour with slug "${dto.slug}" already exists.`);
    }

    const data = {
      ...dto,
      partnerId,
      createdBy: user.id,
      status: dto.status || TourStatus.DRAFT,
    };

    const tour = await this.prisma.tour.create({ data });

    this.logger.log(`✅ Tour created: ID ${tour.id}, slug: ${tour.slug}`);
    return tour;
  }

  /**
   * List all tours (non-deleted).
   * - Admin: sees all tours
   * - Partner admin: sees only tours for their partner
   * - Customer: sees only published tours
   * - Guide/Lead Guide: sees tours for their partner
   */
  async findAll(user: UserPayload) {
    const where: any = { isDeleted: false };

    if (user.role === AppRole.ADMIN) {
      // Admin sees all tours
    } else if (user.role === AppRole.PARTNER_ADMIN) {
      where.partnerId = user.partnerId;
    } else if (user.role === AppRole.GUIDE || user.role === AppRole.LEAD_GUIDE) {
      where.partnerId = user.partnerId;
    } else {
      // Customers see only published tours
      where.status = TourStatus.LIVE;
    }

    return this.prisma.tour.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
        tourMedia: {
          select: {
            id: true,
            url: true,
            isCover: true,
            altText: true,
          },
        },
        tourSchedules: {
          select: {
            id: true,
            startDate: true,
            seatsAvailable: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single tour by ID.
   * - Partner isolation applies (except for admin)
   */
  async findOne(user: UserPayload, id: number) {
    const tour = await this.prisma.tour.findFirst({
      where: { id, isDeleted: false },
      include: {
        partner: true,
        tourMedia: true,
        tourSchedules: {
          include: {
            location: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            reviewText: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }

    // Partner isolation
    if (user.role !== AppRole.ADMIN) {
      if (tour.partnerId !== user.partnerId) {
        throw new ForbiddenException('You do not have access to this tour.');
      }
    }

    return tour;
  }

  /**
   * Update a tour.
   * Only ADMIN or PARTNER_ADMIN can update tours.
   * Partner admin can only update their own partner's tours.
   */
  async update(user: UserPayload, id: number, dto: UpdateTourDto) {
    // Check role
    if (![AppRole.ADMIN, AppRole.PARTNER_ADMIN].includes(user.role as any)) {
      throw new ForbiddenException('Insufficient permissions to update a tour.');
    }

    const tour = await this.prisma.tour.findUnique({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }

    // Partner isolation
    if (user.role !== AppRole.ADMIN) {
      if (tour.partnerId !== user.partnerId) {
        throw new ForbiddenException('You do not have permission to update this tour.');
      }
    }

    // If slug is being updated, check uniqueness
    if (dto.slug && dto.slug !== tour.slug) {
      const existing = await this.prisma.tour.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new BadRequestException(`Tour with slug "${dto.slug}" already exists.`);
      }
    }

    const updated = await this.prisma.tour.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`📝 Tour updated: ID ${updated.id}`);
    return updated;
  }

  /**
   * Soft-delete a tour.
   * Only ADMIN or PARTNER_ADMIN can delete tours.
   */
  async remove(user: UserPayload, id: number) {
    // Check role
    if (![AppRole.ADMIN, AppRole.PARTNER_ADMIN].includes(user.role as any)) {
      throw new ForbiddenException('Insufficient permissions to delete a tour.');
    }

    const tour = await this.prisma.tour.findUnique({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }

    // Partner isolation
    if (user.role !== AppRole.ADMIN) {
      if (tour.partnerId !== user.partnerId) {
        throw new ForbiddenException('You do not have permission to delete this tour.');
      }
    }

    // Soft delete
    const deleted = await this.prisma.tour.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });

    this.logger.log(`🗑️ Tour soft-deleted: ID ${deleted.id}`);
    return { message: `Tour ${id} has been deleted.`, tour: deleted };
  }

  /**
   * Restore a soft-deleted tour.
   * Only ADMIN or PARTNER_ADMIN can restore tours.
   */
  async restore(user: UserPayload, id: number) {
    // Check role
    if (![AppRole.ADMIN, AppRole.PARTNER_ADMIN].includes(user.role as any)) {
      throw new ForbiddenException('Insufficient permissions to restore a tour.');
    }

    const tour = await this.prisma.tour.findUnique({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }

    // Partner isolation
    if (user.role !== AppRole.ADMIN) {
      if (tour.partnerId !== user.partnerId) {
        throw new ForbiddenException('You do not have permission to restore this tour.');
      }
    }

    const restored = await this.prisma.tour.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });

    this.logger.log(`🔄 Tour restored: ID ${restored.id}`);
    return { message: `Tour ${id} has been restored.`, tour: restored };
  }

  /**
   * Change tour status.
   */
  async updateStatus(user: UserPayload, id: number, status: TourStatus) {
    // Check role
    if (![AppRole.ADMIN, AppRole.PARTNER_ADMIN].includes(user.role as any)) {
      throw new ForbiddenException('Insufficient permissions to change tour status.');
    }

    const tour = await this.prisma.tour.findUnique({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }

    // Partner isolation
    if (user.role !== AppRole.ADMIN) {
      if (tour.partnerId !== user.partnerId) {
        throw new ForbiddenException('You do not have permission to change the status of this tour.');
      }
    }

    const updated = await this.prisma.tour.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`🔄 Tour ${id} status updated to: ${status}`);
    return updated;
  }
}