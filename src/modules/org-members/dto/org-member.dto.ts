import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrgMemberStatus, InfluenceLevel } from '@/entities';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class CreateOrgMemberDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z\s.'-]+$/, {
    message: 'Full name can only contain letters, spaces, dots, hyphens, and apostrophes',
  })
  fullName: string;

  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString({ message: 'Mobile number must be a string' })
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9',
  })
  mobile: string;

  @IsNotEmpty({ message: 'Designation is required' })
  @IsString({ message: 'Designation ID must be a string' })
  designationId: string;

  @IsOptional()
  @IsEnum(OrgMemberStatus, { message: 'Status must be ACTIVE, INACTIVE, or PENDING' })
  status?: OrgMemberStatus;

  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @IsOptional()
  @IsEnum(InfluenceLevel, { message: 'Influence level must be NORMAL, MEDIUM, or HIGH' })
  influenceLevel?: InfluenceLevel;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isKeyPerson?: boolean;

  @IsOptional()
  @IsString()
  stateName?: string;

  @IsOptional()
  @IsString()
  districtName?: string;

  @IsOptional()
  @IsString()
  assemblyName?: string;

  @IsOptional()
  @IsString()
  assemblyId?: string;

  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @IsOptional()
  @IsString()
  orgUnitName?: string;

  @IsOptional()
  @IsString()
  panchayatId?: string;

  @IsOptional()
  @IsString()
  panchayatName?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  villageName?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsString()
  wardName?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  boothName?: string;
}

export class UpdateOrgMemberDto extends CreateOrgMemberDto {}

export class OrgMemberFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @IsOptional()
  @IsString()
  panchayatId?: string;

  @IsOptional()
  @IsString()
  villageId?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsString()
  boothId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsEnum(OrgMemberStatus)
  status?: OrgMemberStatus;

  @IsOptional()
  @IsEnum(InfluenceLevel)
  influenceLevel?: InfluenceLevel;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isKeyPerson?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
