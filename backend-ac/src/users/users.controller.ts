import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ================= GET ALL USERS =================
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // ================= CREATE USER =================
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body: any, @Req() req: Request & { user?: any }) {
    return this.usersService.create(body, req.user);
  }

  // ================= DELETE USER =================
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
  ) {
    return this.usersService.delete(id, req.user);
  }
}