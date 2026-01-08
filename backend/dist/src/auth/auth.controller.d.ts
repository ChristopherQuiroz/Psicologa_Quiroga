import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    verifyToken(req: any): {
        message: string;
        user: any;
        timestamp: string;
    };
}
