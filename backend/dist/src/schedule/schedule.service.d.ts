import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
export declare class ScheduleService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findAllBlocks(id_psicologa?: number): Promise<({
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
    findBlockById(id: number): Promise<{
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
    updateBlock(id: number, updateBlockDto: UpdateBlockDto): Promise<{
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    }>;
    removeBlock(id: number): Promise<{
        createdAt: Date;
        id_psicologa: number;
        id_bloque: number;
        titulo: string;
        inicio: Date;
        fin: Date;
        recurrente: boolean;
    }>;
    getWorkingHours(id_psicologa: number): Promise<{
        id_psicologa: number;
        diasSemana: number[];
        horaInicio: string;
        horaFin: string;
        duracionMinimaCita: number;
    }>;
    setWorkingHours(id_psicologa: number, workingHours: any): Promise<{
        message: string;
        id_psicologa: number;
        workingHours: any;
    }>;
}
