import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgMember, OrgMemberDesignation, OrgMemberStatus } from '@/entities';
import {
  CreateOrgMemberDto,
  UpdateOrgMemberDto,
  OrgMemberFilterDto,
} from './dto/org-member.dto';
import { PaginatedResult } from '@/common/dto/pagination.dto';

@Injectable()
export class OrgMembersService {
  constructor(
    @InjectRepository(OrgMember)
    private readonly memberRepo: Repository<OrgMember>,
    @InjectRepository(OrgMemberDesignation)
    private readonly designationRepo: Repository<OrgMemberDesignation>,
  ) {}

  async getStats() {
    const total = await this.memberRepo.count();
    const active = await this.memberRepo.count({ where: { status: OrgMemberStatus.ACTIVE } });
    const pending = await this.memberRepo.count({ where: { status: OrgMemberStatus.PENDING } });
    const keyPersons = await this.memberRepo.count({ where: { isKeyPerson: true } });

    // Designation-wise breakdown used by the dashboard's distribution card
    const designationRaw = await this.memberRepo
      .createQueryBuilder('m')
      .leftJoin('m.designation', 'd')
      .select('COALESCE(d.name, :unassigned)', 'name')
      .addSelect('COUNT(*)', 'count')
      .setParameter('unassigned', 'Unassigned')
      .groupBy('COALESCE(d.name, :unassigned)')
      .orderBy('count', 'DESC')
      .getRawMany();

    const designationCounts = designationRaw.map((row) => ({
      name: row.name,
      count: Number(row.count) || 0,
    }));

    return {
      total,
      active,
      pending,
      keyPersons,
      // Explicit aliases read directly by the dashboard. Key persons are regular
      // members, so `total` already includes them.
      totalMembers: total,
      activeMembers: active,
      designationCounts,
    };
  }

  async findAll(filter: OrgMemberFilterDto): Promise<PaginatedResult<OrgMember>> {
    const page = Number(filter.page) || 1;
    const pageSize = Number(filter.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const query = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.designation', 'designation')
      .skip(skip)
      .take(pageSize);

    if (filter.orgUnitId) {
      query.andWhere('m.orgUnitId = :orgUnitId', { orgUnitId: filter.orgUnitId });
    }
    if (filter.panchayatId) {
      query.andWhere('m.panchayatId = :panchayatId', { panchayatId: filter.panchayatId });
    }
    if (filter.villageId) {
      query.andWhere('m.villageId = :villageId', { villageId: filter.villageId });
    }
    if (filter.wardId) {
      query.andWhere('m.wardId = :wardId', { wardId: filter.wardId });
    }
    if (filter.boothId) {
      query.andWhere('m.boothId = :boothId', { boothId: filter.boothId });
    }
    if (filter.designationId) {
      query.andWhere('m.designationId = :designationId', { designationId: filter.designationId });
    }
    if (filter.status) {
      query.andWhere('m.status = :status', { status: filter.status });
    }
    if (filter.influenceLevel) {
      query.andWhere('m.influenceLevel = :influenceLevel', { influenceLevel: filter.influenceLevel });
    }
    if (filter.isKeyPerson !== undefined) {
      query.andWhere('m.isKeyPerson = :isKeyPerson', { isKeyPerson: filter.isKeyPerson });
    }
    if (filter.search) {
      query.andWhere(
        '(LOWER(m.fullName) LIKE LOWER(:search) OR m.mobile LIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    const sortField = filter.sortBy ? `m.${filter.sortBy}` : 'm.createdAt';
    const sortOrder = (filter.sortDir || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    query.orderBy(sortField, sortOrder);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getKeyPersons(orgUnitId?: string): Promise<OrgMember[]> {
    const query = this.memberRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.designation', 'designation')
      .where('m.isKeyPerson = :isKeyPerson', { isKeyPerson: true });

    if (orgUnitId) {
      query.andWhere('m.orgUnitId = :orgUnitId', { orgUnitId });
    }

    return query.orderBy('m.fullName', 'ASC').getMany();
  }

  async findOne(id: string): Promise<OrgMember> {
    const member = await this.memberRepo.findOne({
      where: { id },
      relations: ['designation'],
    });
    if (!member) {
      throw new NotFoundException(`Org member with ID ${id} not found`);
    }
    return member;
  }

  /**
   * Mobile numbers must be unique across the directory.
   * Also matches the prefixes older records may carry (+91 / 91 / 0).
   */
  private async assertMobileUnique(mobile: string, excludeId?: string): Promise<void> {
    const digits = String(mobile).replace(/\D/g, '').slice(-10);

    const query = this.memberRepo
      .createQueryBuilder('m')
      .where(
        'm.mobile = :exact OR m.mobile = :plain OR m.mobile = :plus91 OR m.mobile = :code91 OR m.mobile = :zero',
        {
          exact: mobile,
          plain: digits,
          plus91: `+91${digits}`,
          code91: `91${digits}`,
          zero: `0${digits}`,
        },
      );

    if (excludeId) {
      query.andWhere('m.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException(
        `Mobile number ${digits} already exists in the directory`,
      );
    }
  }

  async create(dto: CreateOrgMemberDto, userId?: string): Promise<OrgMember> {
    const designation = await this.designationRepo.findOne({
      where: { id: dto.designationId },
    });
    if (!designation) {
      throw new NotFoundException(`Designation with ID ${dto.designationId} not found`);
    }

    await this.assertMobileUnique(dto.mobile);

    const member = this.memberRepo.create({
      ...dto,
      createdById: userId,
    });

    return this.memberRepo.save(member);
  }

  async update(id: string, dto: UpdateOrgMemberDto): Promise<OrgMember> {
    const member = await this.findOne(id);
    if (dto.designationId) {
      const designation = await this.designationRepo.findOne({
        where: { id: dto.designationId },
      });
      if (!designation) {
        throw new NotFoundException(`Designation with ID ${dto.designationId} not found`);
      }
    }

    if (dto.mobile) {
      await this.assertMobileUnique(dto.mobile, id);
    }

    Object.assign(member, dto);
    return this.memberRepo.save(member);
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepo.remove(member);
  }

  async toggleKeyPerson(id: string): Promise<OrgMember> {
    const member = await this.findOne(id);
    member.isKeyPerson = !member.isKeyPerson;
    return this.memberRepo.save(member);
  }

  async toggleStar(id: string): Promise<OrgMember> {
    return this.toggleKeyPerson(id);
  }

  async getDesignations(): Promise<OrgMemberDesignation[]> {
    return this.designationRepo.find({
      order: { orderIndex: 'ASC' },
    });
  }
}
