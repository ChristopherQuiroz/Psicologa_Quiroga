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
exports.ScheduleController = void 0;
const common_1 = require("@nestjs/common");
const schedule_service_1 = require("./schedule.service");
const create_block_dto_1 = require("./dto/create-block.dto");
const update_block_dto_1 = require("./dto/update-block.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const psicologa_guard_1 = require("../auth/guards/psicologa.guard");
let ScheduleController = class ScheduleController {
    scheduleService;
    prisma;
    constructor(scheduleService) {
        this.scheduleService = scheduleService;
    }
    createBlock(createBlockDto) {
        return this.scheduleService.createBlock(createBlockDto);
    }
    findAllBlocks(id_psicologa) {
        return this.scheduleService.findAllBlocks(id_psicologa ? +id_psicologa : undefined);
    }
    findBlockById(id) {
        return this.scheduleService.findBlockById(+id);
    }
    updateBlock(id, updateBlockDto) {
        return this.scheduleService.updateBlock(+id, updateBlockDto);
    }
    removeBlock(id) {
        return this.scheduleService.removeBlock(+id);
    }
    getWorkingHours(id_psicologa) {
        return this.scheduleService.getWorkingHours(+id_psicologa);
    }
    setWorkingHours(id_psicologa, workingHours) {
        return this.scheduleService.setWorkingHours(+id_psicologa, workingHours);
    }
    async getBloqueos(id_psicologa) {
        return this.prisma.bloqueo.findMany({
            where: {
                id_psicologa: parseInt(id_psicologa),
            },
            orderBy: {
                inicio: 'asc',
            },
        });
    }
    async createBloqueo(createBloqueoDto, req) {
        const { titulo, inicio, fin, recurrente, motivo } = createBloqueoDto;
        return this.prisma.bloqueo.create({
            data: {
                titulo,
                inicio: new Date(inicio),
                fin: new Date(fin),
                recurrente,
                motivo,
                id_psicologa: req.user.id_psicologa,
            },
        });
    }
    async deleteBloqueo(id_bloqueo, req) {
        return this.prisma.bloqueo.delete({
            where: {
                id_bloqueo: parseInt(id_bloqueo),
                id_psicologa: req.user.id_psicologa,
            },
        });
    }
    async getHorario(id_psicologa) {
        return {
            lunes: { activo: true, inicio: '09:00', fin: '18:00' },
            martes: { activo: true, inicio: '09:00', fin: '18:00' },
            miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
            jueves: { activo: true, inicio: '09:00', fin: '18:00' },
            viernes: { activo: true, inicio: '09:00', fin: '18:00' },
            sabado: { activo: false, inicio: '10:00', fin: '14:00' },
            domingo: { activo: false, inicio: '09:00', fin: '13:00' },
        };
    }
};
exports.ScheduleController = ScheduleController;
__decorate([
    (0, common_1.Post)('blocks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_block_dto_1.CreateBlockDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "createBlock", null);
__decorate([
    (0, common_1.Get)('blocks'),
    __param(0, (0, common_1.Query)('id_psicologa')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "findAllBlocks", null);
__decorate([
    (0, common_1.Get)('blocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "findBlockById", null);
__decorate([
    (0, common_1.Patch)('blocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_block_dto_1.UpdateBlockDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "updateBlock", null);
__decorate([
    (0, common_1.Delete)('blocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "removeBlock", null);
__decorate([
    (0, common_1.Get)('working-hours/:id_psicologa'),
    __param(0, (0, common_1.Param)('id_psicologa')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "getWorkingHours", null);
__decorate([
    (0, common_1.Post)('working-hours/:id_psicologa'),
    __param(0, (0, common_1.Param)('id_psicologa')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "setWorkingHours", null);
__decorate([
    (0, common_1.Get)('bloqueos/:id_psicologa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id_psicologa')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "getBloqueos", null);
__decorate([
    (0, common_1.Post)('bloqueos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "createBloqueo", null);
__decorate([
    (0, common_1.Delete)('bloqueos/:id_bloqueo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id_bloqueo')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "deleteBloqueo", null);
__decorate([
    (0, common_1.Get)('horario/:id_psicologa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id_psicologa')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "getHorario", null);
exports.ScheduleController = ScheduleController = __decorate([
    (0, common_1.Controller)('schedule'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __metadata("design:paramtypes", [schedule_service_1.ScheduleService])
], ScheduleController);
//# sourceMappingURL=schedule.controller.js.map