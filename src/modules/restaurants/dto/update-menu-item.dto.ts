import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}