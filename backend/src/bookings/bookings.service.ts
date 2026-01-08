// backend/src/bookings/bookings.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingByPsychologistDto } from './dto/create-booking-by-psychologist.dto';
import * as crypto from 'crypto';

export interface HoraDisponible {
  hora: string;
  disponible: boolean;
}

export interface SlotDisponible {
  hora: string;
  disponible: boolean;
}

export interface DuplicadoRow {
  fecha: Date;
  hora: string;
  cantidad: bigint;
}

export interface AvailabilityResponse {
  horasDisponibles: HoraDisponible[];
  fecha: string;
  id_psicologa: number;
}

export interface SlotAvailabilityResponse {
  disponible: boolean;
  date: string;
  hora: string;
  id_psicologa: number;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== PARA PACIENTES ====================
  async create(createBookingDto: CreateBookingDto & { id_paciente: number }) {
    this.logger.log('👤 Paciente creando reserva');
    this.logger.log('📋 Datos recibidos:', createBookingDto);

    const { fecha, hora, id_psicologa, id_consulta, motivo } = createBookingDto;
    const id_paciente = createBookingDto.id_paciente;

    // Validaciones básicas
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw new BadRequestException('Formato de hora inválido. Use HH:MM');
    }

    try {
      // Verificar que el paciente exista
      const paciente = await this.prisma.paciente.findUnique({
        where: { id_paciente },
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Verificar que la psicóloga exista
      const psicologa = await this.prisma.psicologa.findUnique({
        where: { id_psicologa },
      });

      if (!psicologa) {
        throw new NotFoundException('Psicóloga no encontrada');
      }

      // Verificar que el tipo de consulta exista
      const consulta = await this.prisma.consulta.findUnique({
        where: { id_consulta },
      });

      if (!consulta) {
        throw new NotFoundException('Tipo de consulta no encontrado');
      }

      // Crear objeto Date completo
      const [year, month, day] = fecha.split('-').map(Number);
      const [hour, minute] = hora.split(':').map(Number);
      const fechaHoraCompleta = new Date(Date.UTC(year, month - 1, day, hour, minute));

      // Validaciones de fecha/hora
      const ahora = new Date();
      if (fechaHoraCompleta < ahora) {
        throw new BadRequestException('No se puede reservar en el pasado');
      }

      // Horario laboral (9:00 - 18:00)
      if (hour < 9 || hour >= 18) {
        throw new BadRequestException('Horario laboral: 9:00 - 18:00');
      }

      // No fines de semana
      const dia = fechaHoraCompleta.getUTCDay();
      if (dia === 0 || dia === 6) {
        throw new BadRequestException('No hay consultas los fines de semana');
      }

      // Verificar disponibilidad
      const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      
      // Buscar reserva existente
      const reservaExistente = await this.prisma.reserva.findFirst({
        where: {
          id_psicologa,
          fecha: fechaDate,
          hora: hora,
        },
      });

      // Si existe reserva
      if (reservaExistente) {
        this.logger.log('⚠️  Reserva existente encontrada:', {
          id: reservaExistente.id_reserva,
          estado: reservaExistente.estado,
        });

        // Si está cancelada, reactivarla para este paciente
        if (reservaExistente.estado === 'cancelada') {
          this.logger.log('🔄 Reactivando reserva cancelada para paciente');
          
          const reservaActualizada = await this.prisma.reserva.update({
            where: { id_reserva: reservaExistente.id_reserva },
            data: {
              id_paciente: id_paciente,
              id_consulta: id_consulta,
              estado: 'confirmada',
              motivo: motivo || null,
              cancelToken: this.generateCancelToken(),
              updatedAt: new Date(),
            },
            include: {
              paciente: true,
              consulta: true,
              psicologa: true,
            },
          });

          this.logger.log('✅ Reserva reactivada exitosamente para paciente');
          return reservaActualizada;
        } else {
          // Reserva activa
          throw new ConflictException('El horario seleccionado ya no está disponible');
        }
      }

      // Validar disponibilidad del horario
      const isAvailable = await this.isTimeSlotAvailable(
        id_psicologa,
        fechaHoraCompleta,
        consulta.duracion,
      );

      if (!isAvailable) {
        throw new ConflictException('El horario no está disponible');
      }

      // Crear nueva reserva
      const reserva = await this.prisma.reserva.create({
        data: {
          fecha: fechaDate,
          hora: hora,
          id_paciente: id_paciente,
          id_psicologa,
          id_consulta,
          estado: 'confirmada',
          motivo: motivo || null,
          cancelToken: this.generateCancelToken(),
        },
        include: {
          paciente: true,
          consulta: true,
          psicologa: true,
        },
      });

      this.logger.log('✅ RESERVA CREADA EXITOSAMENTE (PACIENTE)');
      return reserva;
    } catch (error: any) {
      this.logger.error('💥 ERROR al crear reserva:', error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la reserva');
    }
  }

  // ==================== PARA PSICÓLOGAS ====================
  async createByPsychologist(
    createBookingDto: CreateBookingByPsychologistDto, 
    user: any
  ) {
    this.logger.log('👩‍⚕️ Psicóloga creando reserva:', user.email);
    this.logger.log('📋 Datos recibidos:', createBookingDto);
    
    const { fecha, hora, id_paciente, id_consulta, id_psicologa } = createBookingDto;

    if (!id_paciente) {
      throw new BadRequestException('El id_paciente es obligatorio');
    }
    
    // Verificar que la psicóloga esté creando la reserva para ella misma
    if (user.id_psicologa !== id_psicologa) {
      this.logger.log('❌ La psicóloga no puede crear reservas para otras psicólogas');
      throw new ForbiddenException('Solo puedes crear reservas en tu propio calendario');
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Validar formato de hora
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw new BadRequestException('Formato de hora inválido. Use HH:MM');
    }

    // Verificar que el paciente exista
    const paciente = await this.prisma.paciente.findUnique({
      where: { id_paciente },
    });
    
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar que el tipo de consulta exista
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta },
    });
    
    if (!consulta) {
      throw new NotFoundException('Tipo de consulta no encontrado');
    }

    // Crear objeto Date completo
    const [year, month, day] = fecha.split('-').map(Number);
    const [hour, minute] = hora.split(':').map(Number);
    const fechaHoraCompleta = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // Validaciones básicas
    const ahora = new Date();
    if (fechaHoraCompleta < ahora) {
      throw new BadRequestException('No se puede reservar en el pasado');
    }

    // Validar horario laboral
    if (hour < 9 || hour >= 18) {
      throw new BadRequestException('Horario laboral: 9:00 - 18:00');
    }

    // Validar que no sea fin de semana
    const dia = fechaHoraCompleta.getUTCDay();
    if (dia === 0 || dia === 6) {
      throw new BadRequestException('No hay consultas los fines de semana');
    }

    // 🔍 Verificar disponibilidad manualmente primero
    this.logger.log('🔍 Verificando disponibilidad manualmente...');
    
    const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    
    // Buscar reservas existentes
    const reservaExistente = await this.prisma.reserva.findFirst({
      where: {
        id_psicologa,
        fecha: fechaDate,
        hora: hora,
      },
    });

    // Si existe una reserva
    if (reservaExistente) {
      this.logger.log('⚠️  Ya existe una reserva en ese horario:', {
        id: reservaExistente.id_reserva,
        estado: reservaExistente.estado,
        pacienteId: reservaExistente.id_paciente,
      });
      
      // Si la reserva está cancelada, REUTILIZARLA
      if (reservaExistente.estado === 'cancelada') {
        this.logger.log('🔄 Reactivando reserva cancelada existente');
        
        const reservaActualizada = await this.prisma.reserva.update({
          where: { id_reserva: reservaExistente.id_reserva },
          data: {
            id_paciente: id_paciente,
            id_consulta: id_consulta,
            estado: 'confirmada',
            motivo: createBookingDto.motivo || null,
            notas: createBookingDto.notas || null,
            cancelToken: this.generateCancelToken(),
            updatedAt: new Date(),
          },
          include: {
            paciente: true,
            consulta: true,
          },
        });
        
        this.logger.log('✅ Reserva reactivada exitosamente');
        return reservaActualizada;
      } else {
        // Si hay una reserva ACTIVA
        throw new ConflictException('Ya existe una reserva activa para esa psicóloga en esa fecha y hora');
      }
    }

    // Si no existe reserva, validar disponibilidad
    const isAvailable = await this.isTimeSlotAvailable(
      id_psicologa,
      fechaHoraCompleta,
      consulta.duracion,
    );

    if (!isAvailable) {
      throw new ConflictException('El horario no está disponible');
    }

    // Crear la reserva
    try {
      const reserva = await this.prisma.reserva.create({
        data: {
          fecha: fechaDate,
          hora: hora,
          id_paciente: id_paciente,
          id_psicologa,
          id_consulta,
          estado: 'confirmada',
          motivo: createBookingDto.motivo || null,
          notas: createBookingDto.notas || null,
          cancelToken: this.generateCancelToken(),
        },
        include: {
          paciente: true,
          consulta: true,
        },
      });

      this.logger.log('✅ RESERVA CREADA EXITOSAMENTE (PSICÓLOGA)');
      return reserva;
    } catch (error: any) {
      this.logger.error('💥 ERROR en base de datos:', error);
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una reserva para esa psicóloga en esa fecha y hora');
      }
      throw new BadRequestException('Error al guardar la reserva: ' + error.message);
    }
  }

  // ==================== MÉTODOS DE DISPONIBILIDAD ====================

  async getAvailableSlots(id_psicologa: number, date: string, id_consulta: number): Promise<SlotDisponible[]> {
    try {
      this.logger.log(`🔍 Obteniendo slots disponibles para psicóloga ${id_psicologa}, fecha ${date}, consulta ${id_consulta}`);

      // Obtener duración de la consulta
      const consulta = await this.prisma.consulta.findUnique({
        where: { id_consulta },
      });

      if (!consulta) {
        // Si no encuentra la consulta, usar duración por defecto de 60 minutos
        this.logger.warn(`Consulta ${id_consulta} no encontrada, usando duración por defecto de 60 minutos`);
      }

      const duracion = consulta?.duracion || 60;
      const fecha = new Date(date);
      fecha.setUTCHours(0, 0, 0, 0);

      // Obtener horas base (9:00 - 17:00, cada hora)
      const horasBase: string[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        horasBase.push(`${hour.toString().padStart(2, '0')}:00`);
      }

      // Verificar disponibilidad para cada hora
      const slotsDisponibles: SlotDisponible[] = [];
      
      for (const hora of horasBase) {
        const [hour, minute] = hora.split(':').map(Number);
        const fechaHora = new Date(Date.UTC(
          fecha.getUTCFullYear(),
          fecha.getUTCMonth(),
          fecha.getUTCDate(),
          hour,
          minute,
          0,
          0
        ));

        try {
          const disponible = await this.isTimeSlotAvailable(
            id_psicologa,
            fechaHora,
            duracion
          );

          slotsDisponibles.push({ hora, disponible });
        } catch (error) {
          this.logger.warn(`Error verificando disponibilidad para hora ${hora}:`, error);
          slotsDisponibles.push({ hora, disponible: false });
        }
      }

      this.logger.log(`✅ ${slotsDisponibles.filter(s => s.disponible).length} slots disponibles encontrados`);
      return slotsDisponibles;
    } catch (error) {
      this.logger.error('💥 ERROR en getAvailableSlots:', error);
      throw error;
    }
  }

  async getAvailability(id_psicologa: number, date: string): Promise<{horasDisponibles: HoraDisponible[], fecha: string, id_psicologa: number}> {
    try {
      const fecha = new Date(date);
      fecha.setUTCHours(0, 0, 0, 0);

      // Obtener reservas del día (excluyendo canceladas)
      const reservasDelDia = await this.prisma.reserva.findMany({
        where: {
          id_psicologa,
          fecha,
          estado: {
            notIn: ['cancelada'],
          },
        },
        select: {
          hora: true,
          id_consulta: true,
        },
      });

      // Obtener bloqueos del día
      const inicioDia = new Date(fecha);
      const finDia = new Date(fecha);
      finDia.setUTCHours(23, 59, 59, 999);

      const bloqueos = await this.prisma.bloqueo.findMany({
        where: {
          id_psicologa,
          OR: [
            { 
              inicio: { lte: finDia }, 
              fin: { gte: inicioDia } 
            },
            { recurrente: true },
          ],
        },
      });

      // Generar horas disponibles (9:00 - 17:00, cada hora)
      const horasDisponibles: HoraDisponible[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        const horaStr = `${hour.toString().padStart(2, '0')}:00`;
        
        // Verificar si ya hay reserva
        const tieneReserva = reservasDelDia.some(r => r.hora === horaStr);
        
        // Verificar si está bloqueado
        const horaDateTime = new Date(fecha);
        horaDateTime.setUTCHours(hour, 0, 0, 0);
        
        const estaBloqueado = bloqueos.some(bloqueo => {
          const inicio = new Date(bloqueo.inicio);
          const fin = new Date(bloqueo.fin);
          return horaDateTime >= inicio && horaDateTime < fin;
        });

        horasDisponibles.push({
          hora: horaStr,
          disponible: !tieneReserva && !estaBloqueado,
        });
      }

      return { horasDisponibles, fecha: date, id_psicologa };
    } catch (error) {
      this.logger.error('💥 ERROR en getAvailability:', error);
      throw error;
    }
  }

  async checkTimeSlot(id_psicologa: number, date: string, hora: string): Promise<SlotAvailabilityResponse> {
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = hora.split(':').map(Number);
      
      const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const fechaHoraCompleta = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

      // Verificar si hay reserva activa en ese horario
      const reservaExistente = await this.prisma.reserva.findFirst({
        where: {
          id_psicologa,
          fecha: fechaDate,
          hora: hora,
          estado: {
            notIn: ['cancelada'],
          },
        },
      });

      if (reservaExistente) {
        return {
          disponible: false,
          date,
          hora,
          id_psicologa,
        };
      }

      // Verificar si hay bloqueo
      const bloqueo = await this.prisma.bloqueo.findFirst({
        where: {
          id_psicologa,
          inicio: { lte: fechaHoraCompleta },
          fin: { gte: fechaHoraCompleta },
        },
      });

      const disponible = !bloqueo;
      
      return {
        disponible,
        date,
        hora,
        id_psicologa,
      };
    } catch (error) {
      this.logger.error('💥 ERROR en checkTimeSlot:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  private generateCancelToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async isTimeSlotAvailable(
    id_psicologa: number,
    fechaHora: Date,
    duracion: number,
    excludeReservaId?: number
  ): Promise<boolean> {
    try {
      // Obtener fecha sin hora (00:00:00)
      const fecha = new Date(Date.UTC(
        fechaHora.getUTCFullYear(),
        fechaHora.getUTCMonth(),
        fechaHora.getUTCDate(),
        0, 0, 0, 0
      ));
      
      // Obtener hora como string "HH:MM"
      const hora = fechaHora.getUTCHours().toString().padStart(2, '0') + ':' + 
                   fechaHora.getUTCMinutes().toString().padStart(2, '0');
      
      // Calcular fin de la cita
      const finCita = new Date(fechaHora.getTime() + duracion * 60000);
      
      // Buscar reservas activas en el mismo día
      const reservasDelDia = await this.prisma.reserva.findMany({
        where: {
          id_psicologa,
          fecha,
          estado: {
            notIn: ['cancelada']
          },
        },
        include: {
          consulta: true,
        },
      });
      
      // Verificar si hay solapamiento
      for (const reserva of reservasDelDia) {
        if (excludeReservaId && reserva.id_reserva === excludeReservaId) {
          continue;
        }
        
        const [reservaHora, reservaMinuto] = reserva.hora.split(':').map(Number);
        const inicioReserva = new Date(Date.UTC(
          fecha.getUTCFullYear(),
          fecha.getUTCMonth(),
          fecha.getUTCDate(),
          reservaHora,
          reservaMinuto,
          0,
          0
        ));
        
        const duracionReserva = reserva.consulta?.duracion || 60;
        const finReserva = new Date(inicioReserva.getTime() + duracionReserva * 60000);
        
        // Verificar solapamiento
        if (fechaHora < finReserva && finCita > inicioReserva) {
          return false;
        }
      }
      
      // Verificar bloqueos
      const bloqueo = await this.prisma.bloqueo.findFirst({
        where: {
          id_psicologa,
          inicio: { lte: fechaHora },
          fin: { gte: new Date(fechaHora.getTime() + duracion * 60000) },
        },
      });
      
      return !bloqueo;
    } catch (error) {
      this.logger.error('💥 ERROR en isTimeSlotAvailable:', error);
      return false;
    }
  }

  // ==================== MÉTODOS EXISTENTES ====================
  async findAll() {
    return this.prisma.reserva.findMany({
      include: {
        paciente: true,
        consulta: true,
        psicologa: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findByPaciente(id_paciente: number) {
    return this.prisma.reserva.findMany({
      where: {
        id_paciente,
        estado: {
          not: 'cancelada',
        },
      },
      include: {
        consulta: true,
        psicologa: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findByPsicologa(id_psicologa: number) {
    return this.prisma.reserva.findMany({
      where: {
        id_psicologa,
      },
      include: {
        paciente: true,
        consulta: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOne(id_reserva: number) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id_reserva },
      include: {
        paciente: true,
        consulta: true,
        psicologa: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva #${id_reserva} no encontrada`);
    }

    return reserva;
  }

  async update(id_reserva: number, updateBookingDto: UpdateBookingDto) {
    await this.findOne(id_reserva);

    return this.prisma.reserva.update({
      where: { id_reserva },
      data: updateBookingDto,
      include: {
        paciente: true,
        consulta: true,
      },
    });
  }

  async cancelBooking(id_reserva: number, user: any) {
    this.logger.log('❌ Cancelando reserva #' + id_reserva);
    
    const reserva = await this.prisma.reserva.findUnique({
      where: { id_reserva },
      include: {
        paciente: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva #${id_reserva} no encontrada`);
    }

    // Verificar permisos
    if (user.tipo === 'paciente') {
      if (reserva.id_paciente !== user.id_paciente) {
        throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
      }
    } else if (user.tipo === 'psicologa') {
      if (reserva.id_psicologa !== user.id_psicologa) {
        throw new ForbiddenException('Solo puedes cancelar reservas de tu agenda');
      }
    } else {
      throw new ForbiddenException('Usuario no autorizado');
    }

    // Validar tiempo de cancelación (24 horas antes)
    const fechaReserva = new Date(reserva.fecha);
    const horaStr = reserva.hora;
    const [hora, minuto] = horaStr.split(':').map(Number);
    fechaReserva.setUTCHours(hora, minuto, 0, 0);

    const ahora = new Date();
    const horasDiferencia = (fechaReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (horasDiferencia < 24 && user.tipo === 'paciente') {
      throw new BadRequestException('Solo puedes cancelar con 24 horas de anticipación');
    }

    const reservaActualizada = await this.prisma.reserva.update({
      where: { id_reserva },
      data: {
        estado: 'cancelada',
        updatedAt: new Date(),
      },
      include: {
        paciente: true,
        consulta: true,
        psicologa: true,
      },
    });

    this.logger.log('✅ Reserva cancelada:', reservaActualizada.id_reserva);
    return reservaActualizada;
  }

  async getAvailabilityDetailed(id_psicologa: number, date: string) {
    const fecha = new Date(date);
    fecha.setUTCHours(0, 0, 0, 0);

    const reservas = await this.prisma.reserva.findMany({
      where: {
        id_psicologa,
        fecha,
      },
      include: {
        paciente: true,
        consulta: true,
      },
      orderBy: {
        hora: 'asc',
      },
    });

    const inicioDia = new Date(fecha);
    const finDia = new Date(fecha);
    finDia.setUTCHours(23, 59, 59, 999);

    const bloqueos = await this.prisma.bloqueo.findMany({
      where: {
        id_psicologa,
        OR: [
          { inicio: { lte: finDia }, fin: { gte: inicioDia } },
          { recurrente: true },
        ],
      },
    });

    return {
      fecha: date,
      id_psicologa,
      reservas,
      bloqueos,
    };
  }

  async remove(id_reserva: number) {
    await this.findOne(id_reserva);

    return this.prisma.reserva.delete({
      where: { id_reserva },
    });
  }

  async cleanDuplicateCancelledBookings(id_psicologa: number) {
    this.logger.log('🧹 Limpiando reservas canceladas duplicadas para psicóloga:', id_psicologa);
    
    const duplicados = await this.prisma.$queryRaw<DuplicadoRow[]>`
      SELECT fecha, hora, COUNT(*) as cantidad
      FROM "Reserva"
      WHERE id_psicologa = ${id_psicologa}
        AND estado = 'cancelada'
      GROUP BY fecha, hora
      HAVING COUNT(*) > 1
    `;

    this.logger.log(`📊 Encontrados ${duplicados.length} grupos de duplicados`);

    let totalEliminadas = 0;
    
    for (const dup of duplicados) {
      const { fecha, hora } = dup;
      
      const reservas = await this.prisma.reserva.findMany({
        where: {
          id_psicologa,
          fecha: new Date(fecha),
          hora: hora,
          estado: 'cancelada',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (reservas.length > 1) {
        const idsAEliminar = reservas.slice(1).map(r => r.id_reserva);
        
        await this.prisma.reserva.deleteMany({
          where: {
            id_reserva: { in: idsAEliminar },
          },
        });

        totalEliminadas += idsAEliminar.length;
      }
    }

    return {
      message: `Se limpiaron ${totalEliminadas} reservas canceladas duplicadas`,
      totalEliminadas,
      gruposProcesados: duplicados.length,
    };
  }

  // ==================== NUEVO MÉTODO PARA OBTENER CONSULTAS ====================
  async getConsultas() {
    try {
      this.logger.log('🔍 Obteniendo tipos de consulta');
      const consultas = await this.prisma.consulta.findMany({
        orderBy: {
          id_consulta: 'asc',
        },
      });

      if (!consultas || consultas.length === 0) {
        // Si no hay consultas en la BD, devolver unas por defecto
        this.logger.warn('No se encontraron consultas en la BD, devolviendo consultas por defecto');
        return [
          { id_consulta: 1, motivo: 'Consulta Individual', duracion: 60, precio: 100 },
          { id_consulta: 2, motivo: 'Terapia de Pareja', duracion: 90, precio: 150 },
          { id_consulta: 3, motivo: 'Sesión de Emergencia', duracion: 30, precio: 80 },
        ];
      }

      return consultas;
    } catch (error) {
      this.logger.error('💥 ERROR obteniendo consultas:', error);
      // En caso de error, devolver consultas por defecto
      return [
        { id_consulta: 1, motivo: 'Consulta Individual', duracion: 60, precio: 100 },
        { id_consulta: 2, motivo: 'Terapia de Pareja', duracion: 90, precio: 150 },
        { id_consulta: 3, motivo: 'Sesión de Emergencia', duracion: 30, precio: 80 },
      ];
    }
  }
}