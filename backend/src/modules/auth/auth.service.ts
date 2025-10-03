import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { RegisterDto, UserRole } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService
  ) {}

  async register(payload: RegisterDto): Promise<Omit<UserEntity, 'password'>> {
    const existing = await this.usersRepository.findOne({ where: { email: payload.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashed = await bcrypt.hash(payload.password, 10);
    const user = this.usersRepository.create({
      email: payload.email.toLowerCase(),
      password: hashed,
      role: payload.role ?? UserRole.ANALYST
    });
    const saved = await this.usersRepository.save(user);
    const { password, ...rest } = saved;
    return rest;
  }

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(payload: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(payload.email, payload.password);
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    return { accessToken: token };
  }
}
