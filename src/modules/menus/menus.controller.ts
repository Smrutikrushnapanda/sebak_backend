import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto, ReorderMenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/entities';

@Controller('menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('my')
  async getMyMenus(@CurrentUser() user: User) {
    const isSystemAdmin = user.role?.isSystem || user.role?.slug === 'admin' || user.role?.slug === 'mla-admin';
    return this.menusService.getMenuTree(user.roleId, isSystemAdmin);
  }

  @Get()
  @RequirePermissions('menu.manage')
  async getAllMenus() {
    return this.menusService.getAllAdminTree();
  }

  @Post()
  @RequirePermissions('menu.manage')
  async create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Patch('reorder')
  @RequirePermissions('menu.manage')
  async reorder(@Body() dto: ReorderMenuDto) {
    await this.menusService.reorder(dto);
    return { success: true, message: 'Menu reordered successfully' };
  }

  @Patch(':id')
  @RequirePermissions('menu.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('menu.manage')
  async remove(@Param('id') id: string) {
    await this.menusService.remove(id);
    return { success: true, message: 'Menu deleted successfully' };
  }
}
