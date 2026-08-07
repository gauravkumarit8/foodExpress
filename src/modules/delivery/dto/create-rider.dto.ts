import { IsOptional, IsString } from 'class-validator';

export class CreateRiderDto {
  @IsOptional()
  @IsString()
  vehicleType?: string;
}