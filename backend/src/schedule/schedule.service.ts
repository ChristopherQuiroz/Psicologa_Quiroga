import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async createBlock(createBlockDto: CreateBlockDto) {
    const { id_psicologa, inicio, fin, ...blockData } = createBlockDto;

    // Verificar que la psicóloga exista
    const psicologa = await this.prisma.psicologa.findUnique({
      where: { id_psicologa },
    });
    if (!psicologa) {
      throw new NotFoundException('Psicóloga no encontrada');
    }

    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);

    // Validar que inicio sea antes que fin
    if (inicioDate >= finDate) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la de fin');
    }

    // 📌 CORRECCIÓN: Obtener todas las reservas para verificar superposición
    const reservas = await this.prisma.reserva.findMany({
      where: {
        id_psicologa,
        estado: { not: 'cancelada' },
      },
      include: {
        consulta: true,
      },
    });

    // Verificar manualmente cada reserva
    for (const reserva of reservas) {
      // Construir la fecha/hora completa de la reserva
      const [horaReserva, minutoReserva] = reserva.hora.split(':').map(Number);
      const inicioReserva = new Date(reserva.fecha);
      inicioReserva.setHours(horaReserva, minutoReserva, 0, 0);
      
      const finReserva = new Date(inicioReserva.getTime() + reserva.consulta.duracion * 60000);

      // Verificar superposición
      if (inicioDate < finReserva && finDate > inicioReserva) {
        throw new ConflictException('El bloque se superpone con reservas existentes');
      }
    }

    return this.prisma.bloqueo.create({
      data: {
        ...blockData,
        inicio: inicioDate,
        fin: finDate,
        id_psicologa,
      },
      include: { psicologa: true },
    });
  }

  async findAllBlocks(id_psicologa?: number) {
    const where = id_psicologa ? { id_psicologa } : {};
    return this.prisma.bloqueo.findMany({
      where,
      include: { psicologa: true },
      orderBy: { inicio: 'asc' },
    });
  }

  async findBlockById(id: number) {
    const block = await this.prisma.bloqueo.findUnique({
      where: { id_bloque: id },
      include: { psicologa: true },
    });

    if (!block) {
      throw new NotFoundException(`Bloqueo con ID ${id} no encontrado`);
    }

    return block;
  }

  async updateBlock(id: number, updateBlockDto: UpdateBlockDto) {
    await this.findBlockById(id);
    return this.prisma.bloqueo.update({
      where: { id_bloque: id },
      data: updateBlockDto,
    });
  }

  async removeBlock(id: number) {
    await this.findBlockById(id);
    return this.prisma.bloqueo.delete({ where: { id_bloque: id } });
  }

  async getWorkingHours(id_psicologa: number) {
    return {
      id_psicologa,
      diasSemana: [1, 2, 3, 4, 5],
      horaInicio: '09:00',
      horaFin: '18:00',
      duracionMinimaCita: 30,
    };
  }

  async setWorkingHours(id_psicologa: number, workingHours: any) {
    return {
      message: 'Horarios actualizados (esto es un placeholder)',
      id_psicologa,
      workingHours,
    };
  }
}