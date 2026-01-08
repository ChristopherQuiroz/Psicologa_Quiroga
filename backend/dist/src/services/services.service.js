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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicesService = class ServicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createServiceDto) {
        return this.prisma.consulta.create({
            data: createServiceDto,
        });
    }
    async findAll() {
        return this.prisma.consulta.findMany({
            orderBy: { motivo: 'asc' },
        });
    }
    async findOne(id) {
        const service = await this.prisma.consulta.findUnique({
            where: { id_consulta: id },
        });
        if (!service) {
            throw new common_1.NotFoundException(`Consulta con ID ${id} no encontrada`);
        }
        return service;
    }
    async update(id, updateServiceDto) {
        await this.findOne(id);
        return this.prisma.consulta.update({
            where: { id_consulta: id },
            data: updateServiceDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.consulta.delete({
            where: { id_consulta: id },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map