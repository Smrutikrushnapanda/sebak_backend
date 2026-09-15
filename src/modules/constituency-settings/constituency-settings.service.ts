import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstituencySettings, RepresentativeType } from '@/entities';
import { UpdateConstituencySettingsDto } from './dto/settings.dto';

@Injectable()
export class ConstituencySettingsService {
  constructor(
    @InjectRepository(ConstituencySettings)
    private readonly settingsRepo: Repository<ConstituencySettings>,
  ) {}

  async getSettings(): Promise<ConstituencySettings> {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 1,
        representativeType: RepresentativeType.MLA,
        portalName: 'Korei MLA Constituency Portal',
        representativeName: 'Shri Akash Dasnayak',
        constituencyName: 'Korei Assembly',
        stateName: 'Odisha',
        districtName: 'Jajpur',
        lokSabhaName: 'Jajpur (SC) Lok Sabha',
        lokSabhaId: 'ls-jajpur',
        assemblyName: 'Korei Assembly',
        assemblyId: 'ac-korei',
        ruralEnabled: true,
        urbanEnabled: true,
        assemblyConstituencies: [
          { id: 'ac-korei', name: 'Korei Assembly', ruralEnabled: true, urbanEnabled: true, districtName: 'Jajpur' },
          { id: 'ac-jajpur', name: 'Jajpur Assembly', ruralEnabled: true, urbanEnabled: true, districtName: 'Jajpur' },
          { id: 'ac-bari', name: 'Bari Assembly', ruralEnabled: true, urbanEnabled: false, districtName: 'Jajpur' },
          { id: 'ac-barchana', name: 'Barchana Assembly', ruralEnabled: true, urbanEnabled: true, districtName: 'Jajpur' },
          { id: 'ac-dharmasala', name: 'Dharmasala Assembly', ruralEnabled: true, urbanEnabled: false, districtName: 'Jajpur' },
          { id: 'ac-sukinda', name: 'Sukinda Assembly', ruralEnabled: true, urbanEnabled: false, districtName: 'Jajpur' },
          { id: 'ac-binjharpur', name: 'Binjharpur Assembly', ruralEnabled: true, urbanEnabled: true, districtName: 'Jajpur' },
        ],
        representativeMobileDisplay: '+91 94370 12345',
        officeAddress: 'Main Constituency Office, Near Collectorate, Jajpur, Odisha - 755001',
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(dto: UpdateConstituencySettingsDto): Promise<ConstituencySettings> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }
}
