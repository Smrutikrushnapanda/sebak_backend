import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, IsBoolean } from 'class-validator';

export class CreateMenuDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuDto extends CreateMenuDto {}

export class ReorderMenuDto {
  @IsNotEmpty()
  items: { id: string; orderIndex: number; parentId?: string | null }[];
}
