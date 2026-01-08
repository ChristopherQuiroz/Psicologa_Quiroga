import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            tipo: string;
            nombre: string;
            telefono: string;
            id_paciente: number;
        };
        message: string;
    }>;
    migrateAllUsersToBcrypt(): Promise<{
        migratedCount: number;
        skippedCount: number;
    }>;
}
