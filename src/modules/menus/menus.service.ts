import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Menu, Role } from '@/entities';
import { CreateMenuDto, UpdateMenuDto, ReorderMenuDto } from './dto/menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async getMenuTree(roleId?: string, isSystemAdmin: boolean = false): Promise<Menu[]> {
    let allowedMenuIds: string[] = [];

    if (!isSystemAdmin && roleId) {
      const role = await this.roleRepo.findOne({
        where: { id: roleId },
        relations: ['menus'],
      });
      if (role && role.menus) {
        allowedMenuIds = role.menus.map((m) => m.id);
      }
    }

    const allMenus = await this.menuRepo.find({
      order: { orderIndex: 'ASC' },
      relations: ['children'],
    });

    const filterAndBuildTree = (parentId: string | null = null): Menu[] => {
      return allMenus
        .filter((item) => {
          const matchesParent = parentId === null ? !item.parentId : item.parentId === parentId;
          const isAllowed = isSystemAdmin || allowedMenuIds.includes(item.id);
          return matchesParent && item.isActive && (isSystemAdmin || isAllowed);
        })
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item) => {
          const children = filterAndBuildTree(item.id);
          return {
            ...item,
            children,
          };
        });
    };

    return filterAndBuildTree(null);
  }

  async getAllAdminTree(): Promise<Menu[]> {
    const allMenus = await this.menuRepo.find({
      order: { orderIndex: 'ASC' },
    });

    const buildTree = (parentId: string | null = null): any[] => {
      return allMenus
        .filter((item) => (parentId === null ? !item.parentId : item.parentId === parentId))
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item) => ({
          ...item,
          children: buildTree(item.id),
        }));
    };

    return buildTree(null);
  }

  async create(dto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepo.create(dto);
    return this.menuRepo.save(menu);
  }

  async update(id: string, dto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException(`Menu #${id} not found`);
    Object.assign(menu, dto);
    return this.menuRepo.save(menu);
  }

  async remove(id: string): Promise<void> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException(`Menu #${id} not found`);
    await this.menuRepo.remove(menu);
  }

  async reorder(dto: ReorderMenuDto): Promise<void> {
    for (const item of dto.items) {
      await this.menuRepo.update(item.id, {
        orderIndex: item.orderIndex,
        parentId: item.parentId || null,
      });
    }
  }
}
