import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

export interface LoginResponse {
  message: string;
  access_token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

export interface RegisterResponse {
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  // ================= LOGIN =================
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user === null) {
      await this.auditService.createLog({
        user: email,
        action: 'Login',
        module: 'Auth',
        subject: 'Login gagal - user tidak ditemukan',
        status: 'failed',
      });

      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.password) {
      await this.auditService.createLog({
        user: user.email,
        action: 'Login',
        module: 'Auth',
        subject: 'Login gagal - password tidak valid',
        status: 'failed',
      });

      throw new UnauthorizedException('Email atau password salah');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await this.auditService.createLog({
        user: user.email,
        action: 'Login',
        module: 'Auth',
        subject: 'Login gagal - password salah',
        status: 'failed',
      });

      throw new UnauthorizedException('Email atau password salah');
    }

    if ((user.status || 'active') !== 'active') {
      await this.auditService.createLog({
        user: user.email,
        action: 'Login',
        module: 'Auth',
        subject: 'Login gagal - akun belum disetujui admin',
        status: 'failed',
      });

      throw new UnauthorizedException(
        'Akun belum disetujui admin. Silakan menunggu approval.',
      );
    }

    const token = this.jwtService.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
    });

    await this.auditService.createLog({
      user: user.email,
      action: 'Login',
      module: 'Auth',
      subject: 'User berhasil login',
      status: 'success',
    });

    return {
      message: 'Login berhasil',
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
      },
    };
  }

  // ================= LOGOUT =================
  async logout(user: { name?: string; email?: string }) {
    await this.auditService.createLog({
      user: user.email || user.name || 'Unknown',
      action: 'Logout',
      module: 'Auth',
      subject: 'User berhasil logout',
      status: 'success',
    });

    return {
      message: 'Logout berhasil',
    };
  }

  // ================= REGISTER =================
  async register(
    name: string,
    email: string,
    password: string,
    role: string,
  ): Promise<RegisterResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser !== null) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: 'dosen',
      status: 'pending',
    });

    const savedUser = await this.userRepository.save(newUser);

    await this.auditService.createLog({
      user: savedUser.email,
      action: 'Create',
      module: 'Auth',
      subject: `Registrasi user baru (${savedUser.email})`,
      newValue: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
      status: 'success',
    });

    return {
      message: 'Register berhasil. Akun menunggu approval admin.',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
    };
  }

  // ================= REQUEST RESET =================
  async requestReset(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user === null) {
      return { message: 'User tidak ditemukan' };
    }

    const token = crypto.randomBytes(32).toString('hex');

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.save(user);

    return {
      message: 'Reset berhasil',
      token,
    };
  }

  // ================= RESET PASSWORD =================
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { resetToken: token },
    });

    if (user === null) {
      return { message: 'Token tidak valid' };
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { message: 'Token expired' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await this.userRepository.save(user);

    return { message: 'Password berhasil diubah' };
  }
}
