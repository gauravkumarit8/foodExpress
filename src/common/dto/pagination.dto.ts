import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query params for any paginated list endpoint: ?page=1&limit=20
 * Kept deliberately small (offset-based, not cursor-based) — fine at this
 * scale, and a straightforward upgrade path to cursor pagination later if
 * a list ever gets large enough for offset pagination's performance
 * characteristics to actually matter.
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { data, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
