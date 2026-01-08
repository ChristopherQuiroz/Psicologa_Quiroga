// backend/src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`🔐 Validando token para ruta: ${request.route?.path}`);
    
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      this.logger.warn('❌ No se encontró token en la petición');
      throw new UnauthorizedException('Token no proporcionado');
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      this.logger.error(`❌ Error de autenticación en ${request.method} ${request.url}`);
      this.logger.error(`Error: ${err?.message || 'Usuario no encontrado'}`);
      this.logger.error(`Info: ${info?.message || 'Sin info'}`);
      throw new UnauthorizedException('No autorizado');
    }
    
    this.logger.debug(`✅ Usuario autenticado: ${user.email} (${user.tipo})`);
    return user;
  }
}