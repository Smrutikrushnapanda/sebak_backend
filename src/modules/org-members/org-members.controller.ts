import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrgMembersService } from './org-members.service';
import {
  CreateOrgMemberDto,
  UpdateOrgMemberDto,
  OrgMemberFilterDto,
} from './dto/org-member.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('org-members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrgMembersController {
  constructor(private readonly membersService: OrgMembersService) {}

  @Get('stats')
  @RequirePermissions('org_member.view')
  async getStats() {
    return this.membersService.getStats();
  }

  @Get('key-persons')
  @RequirePermissions('org_member.view')
  async getKeyPersons(@Query('orgUnitId') orgUnitId?: string) {
    return this.membersService.getKeyPersons(orgUnitId);
  }

  @Get('designations')
  @RequirePermissions('org_member.view')
  async getDesignations() {
    return this.membersService.getDesignations();
  }

  @Get()
  @RequirePermissions('org_member.view')
  async findAll(@Query() filter: OrgMemberFilterDto) {
    return this.membersService.findAll(filter);
  }

  @Get(':id')
  @RequirePermissions('org_member.view')
  async findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Post()
  @RequirePermissions('org_member.create')
  async create(@Body() dto: CreateOrgMemberDto, @CurrentUser('id') userId: string) {
    return this.membersService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermissions('org_member.edit')
  async update(@Param('id') id: string, @Body() dto: UpdateOrgMemberDto) {
    return this.membersService.update(id, dto);
  }

  @Patch(':id/star')
  @RequirePermissions('org_member.edit')
  async toggleKeyPerson(@Param('id') id: string) {
    return this.membersService.toggleKeyPerson(id);
  }

  @Delete(':id')
  @RequirePermissions('org_member.delete')
  async remove(@Param('id') id: string) {
    await this.membersService.remove(id);
    return { success: true, message: 'Member removed successfully' };
  }
}
