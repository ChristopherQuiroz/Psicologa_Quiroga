"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let BookingsService = BookingsService_1 = class BookingsService {
    prisma;
    logger = new common_1.Logger(BookingsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBookingDto) {
        this.logger.log('👤 Paciente creando reserva');
        this.logger.log('📋 Datos recibidos:', createBookingDto);
        const { fecha, hora, id_psicologa, id_consulta, motivo } = createBookingDto;
        const id_paciente = createBookingDto.id_paciente;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new common_1.BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
        }
        if (!/^\d{2}:\d{2}$/.test(hora)) {
            throw new common_1.BadRequestException('Formato de hora inválido. Use HH:MM');
        }
        try {
            const paciente = await this.prisma.paciente.findUnique({
                where: { id_paciente },
            });
            if (!paciente) {
                throw new common_1.NotFoundException('Paciente no encontrado');
            }
            const psicologa = await this.prisma.psicologa.findUnique({
                where: { id_psicologa },
            });
            if (!psicologa) {
                throw new common_1.NotFoundException('Psicóloga no encontrada');
            }
            const consulta = await this.prisma.consulta.findUnique({
                where: { id_consulta },
            });
            if (!consulta) {
                throw new common_1.NotFoundException('Tipo de consulta no encontrado');
            }
            const [year, month, day] = fecha.split('-').map(Number);
            const [hour, minute] = hora.split(':').map(Number);
            const fechaHoraCompleta = new Date(Date.UTC(year, month - 1, day, hour, minute));
            const ahora = new Date();
            if (fechaHoraCompleta < ahora) {
                throw new common_1.BadRequestException('No se puede reservar en el pasado');
            }
            if (hour < 9 || hour >= 18) {
                throw new common_1.BadRequestException('Horario laboral: 9:00 - 18:00');
            }
            const dia = fechaHoraCompleta.getUTCDay();
            if (dia === 0 || dia === 6) {
                throw new common_1.BadRequestException('No hay consultas los fines de semana');
            }
            const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            const reservaExistente = await this.prisma.reserva.findFirst({
                where: {
                    id_psicologa,
                    fecha: fechaDate,
                    hora: hora,
                },
            });
            if (reservaExistente) {
                this.logger.log('⚠️  Reserva existente encontrada:', {
                    id: reservaExistente.id_reserva,
                    estado: reservaExistente.estado,
                });
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
                }
                else {
                    throw new common_1.ConflictException('El horario seleccionado ya no está disponible');
                }
            }
            const isAvailable = await this.isTimeSlotAvailable(id_psicologa, fechaHoraCompleta, consulta.duracion);
            if (!isAvailable) {
                throw new common_1.ConflictException('El horario no está disponible');
            }
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
        }
        catch (error) {
            this.logger.error('💥 ERROR al crear reserva:', error);
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException ||
                error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.BadRequestException('Error al crear la reserva');
        }
    }
    async createByPsychologist(createBookingDto, user) {
        this.logger.log('👩‍⚕️ Psicóloga creando reserva:', user.email);
        this.logger.log('📋 Datos recibidos:', createBookingDto);
        const { fecha, hora, id_paciente, id_consulta, id_psicologa } = createBookingDto;
        if (!id_paciente) {
            throw new common_1.BadRequestException('El id_paciente es obligatorio');
        }
        if (user.id_psicologa !== id_psicologa) {
            this.logger.log('❌ La psicóloga no puede crear reservas para otras psicólogas');
            throw new common_1.ForbiddenException('Solo puedes crear reservas en tu propio calendario');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new common_1.BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
        }
        if (!/^\d{2}:\d{2}$/.test(hora)) {
            throw new common_1.BadRequestException('Formato de hora inválido. Use HH:MM');
        }
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_paciente },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente no encontrado');
        }
        const consulta = await this.prisma.consulta.findUnique({
            where: { id_consulta },
        });
        if (!consulta) {
            throw new common_1.NotFoundException('Tipo de consulta no encontrado');
        }
        const [year, month, day] = fecha.split('-').map(Number);
        const [hour, minute] = hora.split(':').map(Number);
        const fechaHoraCompleta = new Date(Date.UTC(year, month - 1, day, hour, minute));
        const ahora = new Date();
        if (fechaHoraCompleta < ahora) {
            throw new common_1.BadRequestException('No se puede reservar en el pasado');
        }
        if (hour < 9 || hour >= 18) {
            throw new common_1.BadRequestException('Horario laboral: 9:00 - 18:00');
        }
        const dia = fechaHoraCompleta.getUTCDay();
        if (dia === 0 || dia === 6) {
            throw new common_1.BadRequestException('No hay consultas los fines de semana');
        }
        this.logger.log('🔍 Verificando disponibilidad manualmente...');
        const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const reservaExistente = await this.prisma.reserva.findFirst({
            where: {
                id_psicologa,
                fecha: fechaDate,
                hora: hora,
            },
        });
        if (reservaExistente) {
            this.logger.log('⚠️  Ya existe una reserva en ese horario:', {
                id: reservaExistente.id_reserva,
                estado: reservaExistente.estado,
                pacienteId: reservaExistente.id_paciente,
            });
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
            }
            else {
                throw new common_1.ConflictException('Ya existe una reserva activa para esa psicóloga en esa fecha y hora');
            }
        }
        const isAvailable = await this.isTimeSlotAvailable(id_psicologa, fechaHoraCompleta, consulta.duracion);
        if (!isAvailable) {
            throw new common_1.ConflictException('El horario no está disponible');
        }
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
        }
        catch (error) {
            this.logger.error('💥 ERROR en base de datos:', error);
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Ya existe una reserva para esa psicóloga en esa fecha y hora');
            }
            throw new common_1.BadRequestException('Error al guardar la reserva: ' + error.message);
        }
    }
    async getAvailableSlots(id_psicologa, date, id_consulta) {
        try {
            this.logger.log(`🔍 Obteniendo slots disponibles para psicóloga ${id_psicologa}, fecha ${date}, consulta ${id_consulta}`);
            const consulta = await this.prisma.consulta.findUnique({
                where: { id_consulta },
            });
            if (!consulta) {
                this.logger.warn(`Consulta ${id_consulta} no encontrada, usando duración por defecto de 60 minutos`);
            }
            const duracion = consulta?.duracion || 60;
            const fecha = new Date(date);
            fecha.setUTCHours(0, 0, 0, 0);
            const horasBase = [];
            for (let hour = 9; hour <= 17; hour++) {
                horasBase.push(`${hour.toString().padStart(2, '0')}:00`);
            }
            const slotsDisponibles = [];
            for (const hora of horasBase) {
                const [hour, minute] = hora.split(':').map(Number);
                const fechaHora = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), hour, minute, 0, 0));
                try {
                    const disponible = await this.isTimeSlotAvailable(id_psicologa, fechaHora, duracion);
                    slotsDisponibles.push({ hora, disponible });
                }
                catch (error) {
                    this.logger.warn(`Error verificando disponibilidad para hora ${hora}:`, error);
                    slotsDisponibles.push({ hora, disponible: false });
                }
            }
            this.logger.log(`✅ ${slotsDisponibles.filter(s => s.disponible).length} slots disponibles encontrados`);
            return slotsDisponibles;
        }
        catch (error) {
            this.logger.error('💥 ERROR en getAvailableSlots:', error);
            throw error;
        }
    }
    async getAvailability(id_psicologa, date) {
        try {
            const fecha = new Date(date);
            fecha.setUTCHours(0, 0, 0, 0);
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
            const horasDisponibles = [];
            for (let hour = 9; hour <= 17; hour++) {
                const horaStr = `${hour.toString().padStart(2, '0')}:00`;
                const tieneReserva = reservasDelDia.some(r => r.hora === horaStr);
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
        }
        catch (error) {
            this.logger.error('💥 ERROR en getAvailability:', error);
            throw error;
        }
    }
    async checkTimeSlot(id_psicologa, date, hora) {
        try {
            const [year, month, day] = date.split('-').map(Number);
            const [hour, minute] = hora.split(':').map(Number);
            const fechaDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            const fechaHoraCompleta = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
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
        }
        catch (error) {
            this.logger.error('💥 ERROR en checkTimeSlot:', error);
            throw error;
        }
    }
    generateCancelToken() {
        return crypto.randomBytes(16).toString('hex');
    }
    async isTimeSlotAvailable(id_psicologa, fechaHora, duracion, excludeReservaId) {
        try {
            const fecha = new Date(Date.UTC(fechaHora.getUTCFullYear(), fechaHora.getUTCMonth(), fechaHora.getUTCDate(), 0, 0, 0, 0));
            const hora = fechaHora.getUTCHours().toString().padStart(2, '0') + ':' +
                fechaHora.getUTCMinutes().toString().padStart(2, '0');
            const finCita = new Date(fechaHora.getTime() + duracion * 60000);
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
            for (const reserva of reservasDelDia) {
                if (excludeReservaId && reserva.id_reserva === excludeReservaId) {
                    continue;
                }
                const [reservaHora, reservaMinuto] = reserva.hora.split(':').map(Number);
                const inicioReserva = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), reservaHora, reservaMinuto, 0, 0));
                const duracionReserva = reserva.consulta?.duracion || 60;
                const finReserva = new Date(inicioReserva.getTime() + duracionReserva * 60000);
                if (fechaHora < finReserva && finCita > inicioReserva) {
                    return false;
                }
            }
            const bloqueo = await this.prisma.bloqueo.findFirst({
                where: {
                    id_psicologa,
                    inicio: { lte: fechaHora },
                    fin: { gte: new Date(fechaHora.getTime() + duracion * 60000) },
                },
            });
            return !bloqueo;
        }
        catch (error) {
            this.logger.error('💥 ERROR en isTimeSlotAvailable:', error);
            return false;
        }
    }
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
    async findByPaciente(id_paciente) {
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
    async findByPsicologa(id_psicologa) {
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
    async findOne(id_reserva) {
        const reserva = await this.prisma.reserva.findUnique({
            where: { id_reserva },
            include: {
                paciente: true,
                consulta: true,
                psicologa: true,
            },
        });
        if (!reserva) {
            throw new common_1.NotFoundException(`Reserva #${id_reserva} no encontrada`);
        }
        return reserva;
    }
    async update(id_reserva, updateBookingDto) {
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
    async cancelBooking(id_reserva, user) {
        this.logger.log('❌ Cancelando reserva #' + id_reserva);
        const reserva = await this.prisma.reserva.findUnique({
            where: { id_reserva },
            include: {
                paciente: true,
            },
        });
        if (!reserva) {
            throw new common_1.NotFoundException(`Reserva #${id_reserva} no encontrada`);
        }
        if (user.tipo === 'paciente') {
            if (reserva.id_paciente !== user.id_paciente) {
                throw new common_1.ForbiddenException('Solo puedes cancelar tus propias reservas');
            }
        }
        else if (user.tipo === 'psicologa') {
            if (reserva.id_psicologa !== user.id_psicologa) {
                throw new common_1.ForbiddenException('Solo puedes cancelar reservas de tu agenda');
            }
        }
        else {
            throw new common_1.ForbiddenException('Usuario no autorizado');
        }
        const fechaReserva = new Date(reserva.fecha);
        const horaStr = reserva.hora;
        const [hora, minuto] = horaStr.split(':').map(Number);
        fechaReserva.setUTCHours(hora, minuto, 0, 0);
        const ahora = new Date();
        const horasDiferencia = (fechaReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);
        if (horasDiferencia < 24 && user.tipo === 'paciente') {
            throw new common_1.BadRequestException('Solo puedes cancelar con 24 horas de anticipación');
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
    async getAvailabilityDetailed(id_psicologa, date) {
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
    async remove(id_reserva) {
        await this.findOne(id_reserva);
        return this.prisma.reserva.delete({
            where: { id_reserva },
        });
    }
    async cleanDuplicateCancelledBookings(id_psicologa) {
        this.logger.log('🧹 Limpiando reservas canceladas duplicadas para psicóloga:', id_psicologa);
        const duplicados = await this.prisma.$queryRaw `
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
    async getConsultas() {
        try {
            this.logger.log('🔍 Obteniendo tipos de consulta');
            const consultas = await this.prisma.consulta.findMany({
                orderBy: {
                    id_consulta: 'asc',
                },
            });
            if (!consultas || consultas.length === 0) {
                this.logger.warn('No se encontraron consultas en la BD, devolviendo consultas por defecto');
                return [
                    { id_consulta: 1, motivo: 'Consulta Individual', duracion: 60, precio: 100 },
                    { id_consulta: 2, motivo: 'Terapia de Pareja', duracion: 90, precio: 150 },
                    { id_consulta: 3, motivo: 'Sesión de Emergencia', duracion: 30, precio: 80 },
                ];
            }
            return consultas;
        }
        catch (error) {
            this.logger.error('💥 ERROR obteniendo consultas:', error);
            return [
                { id_consulta: 1, motivo: 'Consulta Individual', duracion: 60, precio: 100 },
                { id_consulta: 2, motivo: 'Terapia de Pareja', duracion: 90, precio: 150 },
                { id_consulta: 3, motivo: 'Sesión de Emergencia', duracion: 30, precio: 80 },
            ];
        }
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map