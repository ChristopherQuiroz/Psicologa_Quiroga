import { Module } from '@nestjs/common';
import { PacientesController } from './pacientes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PacientesController],
})
export class PacientesModule {}