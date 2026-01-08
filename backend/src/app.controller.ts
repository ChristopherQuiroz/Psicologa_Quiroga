import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PsicologaGuard } from './auth/guards/psicologa.guard';

@Controller()
export class AppController {
  prisma: any;
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(){
    return {
      message: 'Backend funcionando',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/auth/login, /auth/register',
        health: '/health'
      }
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Turnero Pro API',
    };
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  protectedRoute() {
    return {
      message: 'Esta ruta está protegida para psicólogas',
      timestamp: new Date().toISOString(),
    };
  }

}