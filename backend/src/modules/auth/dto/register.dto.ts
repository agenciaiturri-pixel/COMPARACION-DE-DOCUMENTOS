import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum UserRole {
  ANALYST = 'ANALYST',
  SUPERVISOR = 'SUPERVISOR'
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
