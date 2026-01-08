import { Controller, Get, Put, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PsicologaGuard } from '../auth/guards/psicologa.guard';
import { UpdatePsychologistDto } from './dto/update-psychologist.dto';

@Controller('psychologist')
export class PsychologistController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    // Obtener la psicóloga desde la base de datos
    const psicologa = await this.prisma.psicologa.findUnique({
      where: { id_psicologa: req.user.id_psicologa },
      include: {
        usuario: true // Incluir datos del usuario si existe relación
      }
    });

    // Verificar si existe
    if (!psicologa) {
      throw new NotFoundException('Psicóloga no encontrada');
    }

    return {
      id_psicologa: psicologa.id_psicologa,
      id_usuario: psicologa.id_usuario,
      nombre: psicologa.nombre,
      email: psicologa.usuario?.email, // Acceso seguro con optional chaining
      createdAt: psicologa.createdAt,
      updatedAt: psicologa.updatedAt
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() updateData: UpdatePsychologistDto) {
    const { nombre } = updateData;

    return this.prisma.psicologa.update({
      where: { id_psicologa: req.user.id_psicologa },
      data: {
        nombre
      }
    });
  }
}