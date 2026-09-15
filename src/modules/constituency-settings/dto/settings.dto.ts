import { IsOptional, IsString, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { RepresentativeType, AssemblyConstituencyConfig } from '@/entities';

export class UpdateConstituencySettingsDto {
  @IsOptional()
  @IsEnum(RepresentativeType)
  representativeType?: RepresentativeType;

  @IsOptional()
  @IsString()
  portalName?: string;

  @IsOptional()
  @IsString()
  representativeName?: string;

  @IsOptional()
  @IsString()
  constituencyName?: string;

  @IsOptional()
  @IsString()
  stateName?: string;

  @IsOptional()
  @IsString()
  districtName?: string;

  @IsOptional()
  @IsString()
  lokSabhaName?: string;

  @IsOptional()
  @IsString()
  lokSabhaId?: string;

  @IsOptional()
  @IsString()
  assemblyName?: string;

  @IsOptional()
  @IsString()
  assemblyId?: string;

  @IsOptional()
  @IsBoolean()
  ruralEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  urbanEnabled?: boolean;

  @IsOptional()
  @IsArray()
  assemblyConstituencies?: AssemblyConstituencyConfig[];

  @IsOptional()
  @IsString()
  representativeMobileDisplay?: string;

  @IsOptional()
  @IsString()
  officeAddress?: string;
}
