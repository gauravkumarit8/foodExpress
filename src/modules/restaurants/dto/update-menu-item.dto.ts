import { IsString, IsNumber, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsUrl() imageUrl?: string;
}