import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '@/entities';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserFilterDto,
} from './dto/user.dto';
import { PaginatedResult } from '@/common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(filter: UserFilterDto): Promise<PaginatedResult<Omit<User, 'passwordHash'>>> {
    const page = Number(filter.page) || 1;
    const pageSize = Number(filter.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .skip(skip)
      .take(pageSize);

    if (filter.roleId) {
      query.andWhere('user.roleId = :roleId', { roleId: filter.roleId });
    }

    if (filter.status) {
      query.andWhere('user.status = :status', { status: filter.status });
    }

    if (filter.search) {
      query.andWhere(
        '(LOWER(user.fullName) LIKE LOWER(:search) OR user.mobile LIKE :search OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    const sortField = filter.sortBy ? `user.${filter.sortBy}` : 'user.createdAt';
    const sortOrder = (filter.sortDir || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    query.orderBy(sortField, sortOrder);

    const [users, total] = await query.getManyAndCount();

    const sanitizedUsers = users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest as User;
    });

    return {
      data: sanitizedUsers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role', 'role.permissions', 'role.menus'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    const { passwordHash, ...rest } = user;
    return rest as User;
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.userRepo.findOne({
      where: [{ mobile: dto.mobile }, ...(dto.email ? [{ email: dto.email }] : [])],
    });
    if (existing) {
      throw new BadRequestException('User with this mobile number or email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      passwordHash,
    });

    const saved = await this.userRepo.save(user);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dto.password;
    }

    Object.assign(user, dto);
    await this.userRepo.save(user);
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    user.status = dto.status;
    await this.userRepo.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    await this.userRepo.remove(user);
  }
}
