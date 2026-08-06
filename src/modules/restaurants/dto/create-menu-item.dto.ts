import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  name: string | undefined;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  price: number | undefined;
}