import { Injectable, ConflictException } from '@nestjs/common';
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
    }));
  }

  // ================= CREATE USER =================
  async create(body: CreateUserBody, reqUser?: ReqUser) {
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
      },
    };
  }

  // ================= DELETE USER =================
  async delete(id: number, reqUser?: ReqUser) {
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