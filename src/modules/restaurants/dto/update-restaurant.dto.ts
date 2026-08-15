import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsNumber()
  avgPrepTimeMinutes?: number;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  // Deliberately no latitude/longitude/cityId here — relocating a restaurant
  // is a bigger operation than an inline edit; add a dedicated flow later
  // if that's actually needed.
}
