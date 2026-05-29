import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

interface RequestUser {
  role: string;
  [key: string]: any; // opsional, jika ada properti lain
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private role: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;

    if (!user) return false;

    return user.role === this.role;
  }
}
