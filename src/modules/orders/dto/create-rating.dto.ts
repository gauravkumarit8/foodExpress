import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  restaurantRating: number | undefined;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  riderRating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}