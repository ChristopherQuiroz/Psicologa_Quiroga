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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        console.log('🔐 === INICIANDO LOGIN ===');
        const usuario = await this.prisma.usuario.findUnique({
            where: { email: loginDto.email },
            include: {
                paciente: true,
                psicologa: true,
            }
        });
        if (!usuario) {
            console.log('❌ Usuario no encontrado para email:', loginDto.email);
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        console.log('👤 Usuario encontrado:', usuario.email);
        console.log('🔑 Contraseña proporcionada:', loginDto.password);
        console.log('💾 Hash almacenado en BD:', usuario.password.substring(0, 30) + '...');
        let isValidPassword = false;
        if (usuario.password.startsWith('$2')) {
            console.log('🔍 Comparando con bcrypt...');
            isValidPassword = await bcrypt.compare(loginDto.password, usuario.password);
            console.log('✅ Resultado bcrypt.compare:', isValidPassword);
        }
        else {
            console.log('⚠️  AVISO: Contraseña en texto plano detectada');
            console.log('🔄 Comparando texto plano...');
            isValidPassword = (loginDto.password === usuario.password);
            if (isValidPassword) {
                console.log('🔄 Migrando contraseña a bcrypt automáticamente...');
                try {
                    const hashedPassword = await bcrypt.hash(loginDto.password, 10);
                    await this.prisma.usuario.update({
                        where: { id_usuario: usuario.id_usuario },
                        data: { password: hashedPassword },
                    });
                    console.log('✅ Contraseña migrada exitosamente a bcrypt');
                }
                catch (migrationError) {
                    console.error('❌ Error migrando contraseña:', migrationError);
                }
            }
        }
        if (!isValidPassword) {
            console.log('❌ CONTRASEÑA INVÁLIDA');
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        console.log('🎉 Login exitoso para:', usuario.email);
        const payload = {
            sub: usuario.id_usuario,
            email: usuario.email,
            tipo: usuario.tipo,
        };
        let userResponse = {
            id: usuario.id_usuario,
            email: usuario.email,
            tipo: usuario.tipo,
        };
        if (usuario.tipo === 'paciente' && usuario.paciente) {
            payload.id_paciente = usuario.paciente.id_paciente;
            userResponse.nombre = usuario.paciente.nombre;
            userResponse.telefono = usuario.paciente.telefono;
            userResponse.id_paciente = usuario.paciente.id_paciente;
            console.log('👤 Es paciente, id:', usuario.paciente.id_paciente);
        }
        else if (usuario.tipo === 'psicologa' && usuario.psicologa) {
            payload.id_psicologa = usuario.psicologa.id_psicologa;
            userResponse.nombre = usuario.psicologa.nombre;
            userResponse.id_psicologa = usuario.psicologa.id_psicologa;
            console.log('👩‍⚕️ Es psicóloga, id:', usuario.psicologa.id_psicologa);
        }
        const access_token = this.jwtService.sign(payload);
        console.log('📤 Enviando respuesta al frontend:', {
            tokenPreview: access_token.substring(0, 30) + '...',
            userResponse
        });
        return {
            access_token,
            user: userResponse
        };
    }
    async register(registerDto) {
        const { email, password, nombre, telefono } = registerDto;
        if (!email || !password || !nombre || !telefono) {
            throw new common_1.BadRequestException('Todos los campos son obligatorios');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new common_1.BadRequestException('El formato del email no es válido');
        }
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        console.log('🔐 Hasheando contraseña...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Contraseña hasheada exitosamente');
        const newUser = await this.prisma.$transaction(async (prisma) => {
            const usuario = await prisma.usuario.create({
                data: {
                    email,
                    password: hashedPassword,
                    tipo: 'paciente',
                },
            });
            const paciente = await prisma.paciente.create({
                data: {
                    nombre,
                    telefono,
                    id_usuario: usuario.id_usuario,
                },
            });
            return { usuario, paciente };
        });
        const payload = {
            sub: newUser.usuario.id_usuario,
            email: newUser.usuario.email,
            tipo: newUser.usuario.tipo,
            id_paciente: newUser.paciente.id_paciente,
        };
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '8h' }),
            user: {
                id: newUser.usuario.id_usuario,
                email: newUser.usuario.email,
                tipo: newUser.usuario.tipo,
                nombre: newUser.paciente.nombre,
                telefono: newUser.paciente.telefono,
                id_paciente: newUser.paciente.id_paciente,
            },
            message: 'Registro exitoso. Bienvenido/a ' + nombre,
        };
    }
    async migrateAllUsersToBcrypt() {
        console.log('🔄 === INICIANDO MIGRACIÓN COMPLETA A BCRYPT ===');
        const usuarios = await this.prisma.usuario.findMany();
        console.log(`🔍 Encontrados ${usuarios.length} usuarios`);
        let migratedCount = 0;
        let skippedCount = 0;
        for (const usuario of usuarios) {
            if (usuario.password.startsWith('$2')) {
                console.log(`✅ ${usuario.email}: Ya tiene bcrypt`);
                skippedCount++;
                continue;
            }
            console.log(`🔄 ${usuario.email}: Migrando...`);
            console.log(`   Contraseña actual (texto plano): ${usuario.password}`);
            try {
                const hashedPassword = await bcrypt.hash(usuario.password, 10);
                await this.prisma.usuario.update({
                    where: { id_usuario: usuario.id_usuario },
                    data: { password: hashedPassword },
                });
                migratedCount++;
                console.log(`✅ ${usuario.email}: Migrado exitosamente`);
            }
            catch (error) {
                console.error(`❌ ${usuario.email}: Error en migración:`, error);
            }
        }
        console.log('🎉 MIGRACIÓN COMPLETADA');
        console.log(`✅ ${migratedCount} usuarios migrados`);
        console.log(`⏭️  ${skippedCount} usuarios ya tenían bcrypt`);
        return { migratedCount, skippedCount };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map