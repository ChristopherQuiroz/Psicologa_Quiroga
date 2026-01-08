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
exports.PsychologistController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const update_psychologist_dto_1 = require("./dto/update-psychologist.dto");
let PsychologistController = class PsychologistController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(req) {
        const psicologa = await this.prisma.psicologa.findUnique({
            where: { id_psicologa: req.user.id_psicologa },
            include: {
                usuario: true
            }
        });
        if (!psicologa) {
            throw new common_1.NotFoundException('Psicóloga no encontrada');
        }
        return {
            id_psicologa: psicologa.id_psicologa,
            id_usuario: psicologa.id_usuario,
            nombre: psicologa.nombre,
            email: psicologa.usuario?.email,
            createdAt: psicologa.createdAt,
            updatedAt: psicologa.updatedAt
        };
    }
    async updateProfile(req, updateData) {
        const { nombre } = updateData;
        return this.prisma.psicologa.update({
            where: { id_psicologa: req.user.id_psicologa },
            data: {
                nombre
            }
        });
    }
};
exports.PsychologistController = PsychologistController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_psychologist_dto_1.UpdatePsychologistDto]),
    __metadata("design:returntype", Promise)
], PsychologistController.prototype, "updateProfile", null);
exports.PsychologistController = PsychologistController = __decorate([
    (0, common_1.Controller)('psychologist'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PsychologistController);
//# sourceMappingURL=psychologist.controller.js.map