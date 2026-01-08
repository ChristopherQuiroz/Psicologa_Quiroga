// backend/src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Buscar usuario completo con relaciones
    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario: payload.sub },
      include: {
        paciente: true,
        psicologa: true,
      },
    });

    if (!user) {
      return null;
    }

    // Preparar datos del usuario para el request
    const userData: any = {
      id: user.id_usuario,
      email: user.email,
      tipo: user.tipo,
    };

    if (user.tipo === 'psicologa' && user.psicologa) {
      userData.nombre = user.psicologa.nombre;
      userData.id_psicologa = user.psicologa.id_psicologa;
    } else if (user.tipo === 'paciente' && user.paciente) {
      userData.nombre = user.paciente.nombre;
      userData.telefono = user.paciente.telefono;
      userData.id_paciente = user.paciente.id_paciente;
    }

    return userData;
  }
}