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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ScheduleService = class ScheduleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBlock(createBlockDto) {
        const { id_psicologa, inicio, fin, ...blockData } = createBlockDto;
        const psicologa = await this.prisma.psicologa.findUnique({
            where: { id_psicologa },
        });
        if (!psicologa) {
            throw new common_1.NotFoundException('Psicóloga no encontrada');
        }
        const inicioDate = new Date(inicio);
        const finDate = new Date(fin);
        if (inicioDate >= finDate) {
            throw new common_1.BadRequestException('La fecha de inicio debe ser anterior a la de fin');
        }
        const reservas = await this.prisma.reserva.findMany({
            where: {
                id_psicologa,
                estado: { not: 'cancelada' },
            },
            include: {
                consulta: true,
            },
        });
        for (const reserva of reservas) {
            const [horaReserva, minutoReserva] = reserva.hora.split(':').map(Number);
            const inicioReserva = new Date(reserva.fecha);
            inicioReserva.setHours(horaReserva, minutoReserva, 0, 0);
            const finReserva = new Date(inicioReserva.getTime() + reserva.consulta.duracion * 60000);
            if (inicioDate < finReserva && finDate > inicioReserva) {
                throw new common_1.ConflictException('El bloque se superpone con reservas existentes');
            }
        }
        return this.prisma.bloqueo.create({
            data: {
                ...blockData,
                inicio: inicioDate,
                fin: finDate,
                id_psicologa,
            },
            include: { psicologa: true },
        });
    }
    async findAllBlocks(id_psicologa) {
        const where = id_psicologa ? { id_psicologa } : {};
        return this.prisma.bloqueo.findMany({
            where,
            include: { psicologa: true },
            orderBy: { inicio: 'asc' },
        });
    }
    async findBlockById(id) {
        const block = await this.prisma.bloqueo.findUnique({
            where: { id_bloque: id },
            include: { psicologa: true },
        });
        if (!block) {
            throw new common_1.NotFoundException(`Bloqueo con ID ${id} no encontrado`);
        }
        return block;
    }
    async updateBlock(id, updateBlockDto) {
        await this.findBlockById(id);
        return this.prisma.bloqueo.update({
            where: { id_bloque: id },
            data: updateBlockDto,
        });
    }
    async removeBlock(id) {
        await this.findBlockById(id);
        return this.prisma.bloqueo.delete({ where: { id_bloque: id } });
    }
    async getWorkingHours(id_psicologa) {
        return {
            id_psicologa,
            diasSemana: [1, 2, 3, 4, 5],
            horaInicio: '09:00',
            horaFin: '18:00',
            duracionMinimaCita: 30,
        };
    }
    async setWorkingHours(id_psicologa, workingHours) {
        return {
            message: 'Horarios actualizados (esto es un placeholder)',
            id_psicologa,
            workingHours,
        };
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map