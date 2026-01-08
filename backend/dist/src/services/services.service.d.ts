import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createServiceDto: CreateServiceDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
    findAll(): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }[]>;
    findOne(id: number): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
    update(id: number, updateServiceDto: UpdateServiceDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
    remove(id: number): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
}
