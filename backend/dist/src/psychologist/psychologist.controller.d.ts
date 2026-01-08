import { PrismaService } from '../prisma/prisma.service';
import { UpdatePsychologistDto } from './dto/update-psychologist.dto';
export declare class PsychologistController {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(req: any): Promise<{
        id_psicologa: number;
        id_usuario: number;
        nombre: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(req: any, updateData: UpdatePsychologistDto): Promise<{
        id_usuario: number;
        createdAt: Date;
        updatedAt: Date;
        nombre: string;
        id_psicologa: number;
    }>;
}
