import { ScheduleService } from './schedule.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
export declare class ScheduleController {
    private readonly scheduleService;
    prisma: any;
    constructor(scheduleService: ScheduleService);
    createBlock(createBlockDto: CreateBlockDto): Promise<{
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
    } & {
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    }>;
    findAllBlocks(id_psicologa?: string): Promise<({
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
    } & {
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    })[]>;
    findBlockById(id: string): Promise<{
        psicologa: {
            id_usuario: number;
            createdAt: Date;
            updatedAt: Date;
            nombre: string;
            id_psicologa: number;
        };
    } & {
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    }>;
    updateBlock(id: string, updateBlockDto: UpdateBlockDto): Promise<{
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    }>;
    removeBlock(id: string): Promise<{
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    }>;
    getWorkingHours(id_psicologa: string): Promise<{
        id_psicologa: number;
        diasSemana: number[];
        horaInicio: string;
        horaFin: string;
        duracionMinimaCita: number;
    }>;
    setWorkingHours(id_psicologa: string, workingHours: any): Promise<{
        message: string;
        id_psicologa: number;
        workingHours: any;
    }>;
    getBloqueos(id_psicologa: string): Promise<any>;
    createBloqueo(createBloqueoDto: any, req: any): Promise<any>;
    deleteBloqueo(id_bloqueo: string, req: any): Promise<any>;
    getHorario(id_psicologa: string): Promise<{
        lunes: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
        martes: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
        miercoles: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
        jueves: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
        viernes: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
        sabado: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
        domingo: {
            activo: boolean;
            inicio: string;
            fin: string;
        };
    }>;
}
