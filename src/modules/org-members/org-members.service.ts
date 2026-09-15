import { Injectable, NotFoundException } from '@nestjs/common';
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

    return {
      total,
      active,
      pending,
      keyPersons,
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

  async create(dto: CreateOrgMemberDto, userId?: string): Promise<OrgMember> {
    const designation = await this.designationRepo.findOne({
      where: { id: dto.designationId },
    });
    if (!designation) {
      throw new NotFoundException(`Designation with ID ${dto.designationId} not found`);
    }

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
