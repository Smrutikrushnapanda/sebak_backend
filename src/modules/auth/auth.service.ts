import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, RefreshToken, UserStatus } from '@/entities';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { mobile: loginDto.mobile },
      relations: ['role', 'role.permissions', 'role.menus'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid mobile number or password');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid mobile number or password');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user);

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const refreshTokenRecord = await this.refreshTokenRepo.findOne({
      where: { tokenHash: dto.refreshToken, revoked: false },
    });

    if (!refreshTokenRecord || new Date() > refreshTokenRecord.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: refreshTokenRecord.userId },
      relations: ['role', 'role.permissions', 'role.menus'],
    });

    if (!user || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old refresh token
    refreshTokenRecord.revoked = true;
    await this.refreshTokenRepo.save(refreshTokenRecord);

    const tokens = await this.generateTokens(user);
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, revoked: false },
      { revoked: true },
    );
    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions', 'role.menus'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      mobile: user.mobile,
      role: user.role?.slug,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'mla_jwt_super_secret_access_key_2026',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const refreshTokenString = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'mla_jwt_super_secret_refresh_key_2026',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshTokenEntity = this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshTokenString,
      expiresAt,
      revoked: false,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
