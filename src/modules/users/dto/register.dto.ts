import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

// Deliberately narrower than UserRole — ADMIN is excluded so it can never be
// a valid value here at all, not even via a bypassed check. Admin accounts
// are created only via direct DB access (or the seed script), never through
// public registration.
export enum SelfRegisterableRole {
  CUSTOMER = 'customer',
  RESTAURANT_OWNER = 'restaurant_owner',
  RIDER = 'rider',
}

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(SelfRegisterableRole)
  role?: SelfRegisterableRole;
}
