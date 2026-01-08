import { Controller, Get, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PsicologaGuard } from '../auth/guards/psicologa.guard';

@Controller('pacientes')
export class PacientesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async findAll() {
    return this.prisma.paciente.findMany({
      select: {
        id_paciente: true,
        nombre: true,
        telefono: true,
        usuario: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }



  // Nuevo: Historial de consultas por paciente
  @Get(':id_paciente/historial')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async getHistorial(@Param('id_paciente') id_paciente: string) {
    // 📌 CORRECCIÓN: Cambiado fecha_hora por fecha y hora separados
    return this.prisma.reserva.findMany({
      where: {
        id_paciente: parseInt(id_paciente),
      },
      include: {
        consulta: true,
        psicologa: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ],
    });
  }

  @Get(':id/reservas')
  //@UseGuards(JwtAuthGuard)
  async getReservas(@Param('id') id: string) {
    // Primero obtener el paciente con su usuario
    const paciente = await this.prisma.paciente.findUnique({
      where: { id_paciente: parseInt(id) },
      include: {
        usuario: true,
      },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Luego obtener las reservas del paciente
    const reservas = await this.prisma.reserva.findMany({
      where: { 
        id_paciente: parseInt(id) 
      },
      include: {
        psicologa: true,
        consulta: true,
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' }
      ],
    });

    // Formatear la respuesta
    return {
      paciente: {
        id_paciente: paciente.id_paciente,
        nombre: paciente.nombre,
        telefono: paciente.telefono,
        email: paciente.usuario.email,
      },
      reservas,
    };
  }
}