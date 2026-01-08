import { PrismaService } from '../prisma/prisma.service';
export declare class PacientesController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        usuario: {
            email: string;
        };
        nombre: string;
        telefono: string;
        id_paciente: number;
    }[]>;
    getHistorial(id_paciente: string): Promise<({
        psicologa: {
            nombre: string;
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
    getReservas(id: string): Promise<{
        paciente: {
            id_paciente: number;
            nombre: string;
            telefono: string;
            email: string;
        };
        reservas: ({
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
        })[];
    }>;
}
