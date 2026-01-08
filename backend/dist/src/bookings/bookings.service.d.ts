import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingByPsychologistDto } from './dto/create-booking-by-psychologist.dto';
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
export declare class BookingsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createBookingDto: CreateBookingDto & {
        id_paciente: number;
    }): Promise<{
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    }>;
    createByPsychologist(createBookingDto: CreateBookingByPsychologistDto, user: any): Promise<{
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    }>;
    getAvailableSlots(id_psicologa: number, date: string, id_consulta: number): Promise<SlotDisponible[]>;
    getAvailability(id_psicologa: number, date: string): Promise<{
        horasDisponibles: HoraDisponible[];
        fecha: string;
        id_psicologa: number;
    }>;
    checkTimeSlot(id_psicologa: number, date: string, hora: string): Promise<SlotAvailabilityResponse>;
    private generateCancelToken;
    private isTimeSlotAvailable;
    findAll(): Promise<({
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    })[]>;
    findByPaciente(id_paciente: number): Promise<({
        psicologa: {
            usuario: {
                id_usuario: number;
                email: string;
                password: string;
                tipo: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    })[]>;
    findByPsicologa(id_psicologa: number): Promise<({
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    })[]>;
    findOne(id_reserva: number): Promise<{
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    }>;
    update(id_reserva: number, updateBookingDto: UpdateBookingDto): Promise<{
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    }>;
    cancelBooking(id_reserva: number, user: any): Promise<{
        paciente: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
        consulta: {
            createdAt: Date;
            updatedAt: Date;
            motivo: string;
            duracion: number;
            precio: number | null;
            id_consulta: number;
        };
    } & {
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    }>;
    getAvailabilityDetailed(id_psicologa: number, date: string): Promise<{
        fecha: string;
        id_psicologa: number;
        reservas: ({
            paciente: {
                id_usuario: number;
                createdAt: Date;
                updatedAt: Date;
                nombre: string;
                telefono: string;
                id_paciente: number;
            };
            consulta: {
                createdAt: Date;
                updatedAt: Date;
                motivo: string;
                duracion: number;
                precio: number | null;
                id_consulta: number;
            };
        } & {
            createdAt: Date;
            updatedAt: Date;
            id_psicologa: number;
            motivo: string | null;
            id_consulta: number;
            id_paciente: number;
            fecha: Date;
            hora: string;
            notas: string | null;
            estado: string;
            cancelToken: string | null;
            id_reserva: number;
        })[];
        bloqueos: {
            createdAt: Date;
            id_psicologa: number;
            id_bloque: number;
            titulo: string;
            inicio: Date;
            fin: Date;
            recurrente: boolean;
        }[];
    }>;
    remove(id_reserva: number): Promise<{
        createdAt: Date;
        updatedAt: Date;
        id_psicologa: number;
        motivo: string | null;
        id_consulta: number;
        id_paciente: number;
        fecha: Date;
        hora: string;
        notas: string | null;
        estado: string;
        cancelToken: string | null;
        id_reserva: number;
    }>;
    cleanDuplicateCancelledBookings(id_psicologa: number): Promise<{
        message: string;
        totalEliminadas: number;
        gruposProcesados: number;
    }>;
    getConsultas(): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }[] | {
        id_consulta: number;
        motivo: string;
        duracion: number;
        precio: number;
    }[]>;
}
