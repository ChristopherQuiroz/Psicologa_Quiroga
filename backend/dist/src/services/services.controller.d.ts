import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
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
    findOne(id: string): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
    update(id: string, updateServiceDto: UpdateServiceDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
    remove(id: string): Promise<{
        createdAt: Date;
        updatedAt: Date;
        motivo: string;
        duracion: number;
        precio: number | null;
        id_consulta: number;
    }>;
}
