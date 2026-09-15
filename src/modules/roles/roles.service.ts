import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, Permission, Menu } from '@/entities';
import {
  CreateRoleDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
  UpdateRoleMenusDto,
} from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      relations: ['permissions', 'menus'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions', 'menus'],
    });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({
      where: [{ name: dto.name }, { slug: dto.slug }],
    });
    if (existing) {
      throw new BadRequestException('A role with this name or slug already exists');
    }
    const role = this.roleRepo.create(dto);
    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (role.isSystem && dto.slug && dto.slug !== role.slug) {
      throw new ForbiddenException('Cannot modify the slug of a system role');
    }
    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete a system role');
    }
    await this.roleRepo.remove(role);
  }

  async updatePermissions(id: string, dto: UpdateRolePermissionsDto): Promise<Role> {
    const role = await this.findOne(id);
    const permissions = await this.permissionRepo.find({
      where: { key: In(dto.permissionKeys) },
    });
    role.permissions = permissions;
    return this.roleRepo.save(role);
  }

  async updateMenus(id: string, dto: UpdateRoleMenusDto): Promise<Role> {
    const role = await this.findOne(id);
    const menus = dto.menuIds.length > 0 ? await this.menuRepo.find({
      where: { id: In(dto.menuIds) },
    }) : [];
    role.menus = menus;
    return this.roleRepo.save(role);
  }
}
