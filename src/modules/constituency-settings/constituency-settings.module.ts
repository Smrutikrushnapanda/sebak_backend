import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstituencySettings } from '@/entities';
import { ConstituencySettingsService } from './constituency-settings.service';
import { ConstituencySettingsController } from './constituency-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConstituencySettings])],
  controllers: [ConstituencySettingsController],
  providers: [ConstituencySettingsService],
  exports: [ConstituencySettingsService],
})
export class ConstituencySettingsModule {}
