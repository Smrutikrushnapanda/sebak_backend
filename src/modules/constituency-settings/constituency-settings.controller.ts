import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConstituencySettingsService } from './constituency-settings.service';
import { UpdateConstituencySettingsDto } from './dto/settings.dto';
import { JwtAuthGuard, Public } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConstituencySettingsController {
  constructor(private readonly settingsService: ConstituencySettingsService) {}

  @Public()
  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @RequirePermissions('role.manage')
  async updateSettings(@Body() dto: UpdateConstituencySettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
