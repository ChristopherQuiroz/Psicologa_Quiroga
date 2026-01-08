"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientesController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const psicologa_guard_1 = require("../auth/guards/psicologa.guard");
let PacientesController = class PacientesController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.paciente.findMany({
            select: {
                id_paciente: true,
                nombre: true,
                telefono: true,
                usuario: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                nombre: 'asc',
            },
        });
    }
    async getHistorial(id_paciente) {
        return this.prisma.reserva.findMany({
            where: {
                id_paciente: parseInt(id_paciente),
            },
            include: {
                consulta: true,
                psicologa: {
                    select: {
                        nombre: true,
                    },
                },
            },
            orderBy: [
                { fecha: 'desc' },
                { hora: 'desc' }
            ],
        });
    }
    async getReservas(id) {
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_paciente: parseInt(id) },
            include: {
                usuario: true,
            },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente no encontrado');
        }
        const reservas = await this.prisma.reserva.findMany({
            where: {
                id_paciente: parseInt(id)
            },
            include: {
                psicologa: true,
                consulta: true,
            },
            orderBy: [
                { fecha: 'asc' },
                { hora: 'asc' }
            ],
        });
        return {
            paciente: {
                id_paciente: paciente.id_paciente,
                nombre: paciente.nombre,
                telefono: paciente.telefono,
                email: paciente.usuario.email,
            },
            reservas,
        };
    }
};
exports.PacientesController = PacientesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id_paciente/historial'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id_paciente')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "getHistorial", null);
__decorate([
    (0, common_1.Get)(':id/reservas'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "getReservas", null);
exports.PacientesController = PacientesController = __decorate([
    (0, common_1.Controller)('pacientes'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PacientesController);
//# sourceMappingURL=pacientes.controller.js.map