import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { AuditService } from '../audit/audit.service';

type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  role: string;
};

type ReqUser = {
  name?: string;
  email?: string;
  role?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  // ================= GET ALL USERS =================
  async findAll() {
    const users = await this.userRepository.find();

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
    }));
  }

  private ensureAdmin(reqUser?: ReqUser) {
    if (reqUser?.role !== 'Admin') {
      throw new ForbiddenException('Hanya admin yang dapat mengelola user');
    }
  }

  // ================= CREATE USER =================
  async create(body: CreateUserBody, reqUser?: ReqUser) {
    this.ensureAdmin(reqUser);

    const existingUser = await this.userRepository.findOne({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = this.userRepository.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role,
      status: 'active',
    });

    const savedUser = await this.userRepository.save(newUser);

    await this.auditService.createLog({
      user: reqUser?.name || reqUser?.email || 'Unknown',
      action: 'Create',
      module: 'User',
      subject: `Menambah user (${savedUser.email})`,
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
      message: 'User berhasil ditambahkan',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
    };
  }

  // ================= APPROVE USER =================
  async approve(id: number, reqUser?: ReqUser) {
    this.ensureAdmin(reqUser);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const oldStatus = user.status || 'active';
    user.status = 'active';

    const savedUser = await this.userRepository.save(user);

    await this.auditService.createLog({
      user: reqUser?.name || reqUser?.email || 'Unknown',
      action: 'Approve',
      module: 'User',
      subject: `Menyetujui registrasi user (${savedUser.email})`,
      oldValue: {
        id: savedUser.id,
        email: savedUser.email,
        status: oldStatus,
      },
      newValue: {
        id: savedUser.id,
        email: savedUser.email,
        status: savedUser.status,
      },
      status: 'success',
    });

    return {
      message: 'User berhasil disetujui',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
    };
  }

  // ================= DELETE USER =================
  async delete(id: number, reqUser?: ReqUser) {
    this.ensureAdmin(reqUser);

    const oldUser = await this.userRepository.findOne({
      where: { id },
    });

    await this.userRepository.delete(id);

    await this.auditService.createLog({
      user: reqUser?.name || reqUser?.email || 'Unknown',
      action: 'Delete',
      module: 'User',
      subject: oldUser
        ? `Menghapus user (${oldUser.email})`
        : `Menghapus user dengan id ${id}`,
      oldValue: oldUser
        ? {
            id: oldUser.id,
            name: oldUser.name,
            email: oldUser.email,
            role: oldUser.role,
          }
        : undefined,
      status: 'success',
    });

    return {
      message: 'User berhasil dihapus',
    };
  }
}
