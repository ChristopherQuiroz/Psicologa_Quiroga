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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const update_booking_dto_1 = require("./dto/update-booking.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const psicologa_guard_1 = require("../auth/guards/psicologa.guard");
const create_booking_by_psychologist_dto_1 = require("./dto/create-booking-by-psychologist.dto");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async getAvailability(id_psicologa, date, res) {
        try {
            if (!id_psicologa || !date) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Se requieren los parámetros id_psicologa y date',
                });
            }
            const result = await this.bookingsService.getAvailability(+id_psicologa, date);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener disponibilidad',
                error: error.message,
            });
        }
    }
    async checkTimeSlot(id_psicologa, date, hora, res) {
        try {
            if (!id_psicologa || !date || !hora) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Se requieren id_psicologa, date y hora',
                });
            }
            const result = await this.bookingsService.checkTimeSlot(+id_psicologa, date, hora);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al verificar disponibilidad del slot',
                error: error.message,
            });
        }
    }
    async create(createBookingDto, req, res) {
        try {
            console.log('📥 Solicitud de creación de reserva desde PACIENTE');
            console.log('🔐 Usuario del token:', req.user);
            console.log('📋 Body recibido:', createBookingDto);
            if (req.user.tipo !== 'paciente') {
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                    success: false,
                    message: 'Solo los pacientes pueden crear reservas',
                });
            }
            if (!req.user.id_paciente) {
                console.error('❌ Token NO contiene id_paciente:', req.user);
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                    success: false,
                    message: 'Token inválido: no contiene id_paciente',
                });
            }
            const bookingData = {
                fecha: createBookingDto.fecha,
                hora: createBookingDto.hora,
                id_psicologa: createBookingDto.id_psicologa,
                id_consulta: createBookingDto.id_consulta,
                motivo: createBookingDto.motivo,
                id_paciente: req.user.id_paciente,
            };
            console.log('📊 Datos completos para crear reserva:', bookingData);
            const result = await this.bookingsService.create(bookingData);
            return res.status(common_1.HttpStatus.CREATED).json(result);
        }
        catch (error) {
            console.error('💥 ERROR creando reserva:', error);
            let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            let message = 'Error al crear la reserva';
            if (error instanceof common_1.BadRequestException) {
                status = common_1.HttpStatus.BAD_REQUEST;
                message = error.message;
            }
            else if (error instanceof common_1.ConflictException) {
                status = common_1.HttpStatus.CONFLICT;
                message = error.message;
            }
            else if (error instanceof common_1.NotFoundException) {
                status = common_1.HttpStatus.NOT_FOUND;
                message = error.message;
            }
            return res.status(status).json({
                success: false,
                message,
                error: error.message,
            });
        }
    }
    async getAvailableSlots(id_psicologa, date, id_consulta, res) {
        try {
            if (!id_psicologa || !date || !id_consulta) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Se requieren id_psicologa, date e id_consulta',
                });
            }
            const result = await this.bookingsService.getAvailableSlots(+id_psicologa, date, +id_consulta);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            console.error('💥 ERROR en available-slots:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener slots disponibles',
                error: error.message,
            });
        }
    }
    async getConsultas(res) {
        try {
            console.log('🔍 Solicitando tipos de consulta');
            const consultas = await this.bookingsService.getConsultas();
            return res.status(common_1.HttpStatus.OK).json(consultas);
        }
        catch (error) {
            console.error('💥 ERROR obteniendo consultas:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener tipos de consulta',
                error: error.message,
                defaultConsultas: [
                    { id_consulta: 1, motivo: 'Consulta Individual', duracion: 60 },
                    { id_consulta: 2, motivo: 'Terapia de Pareja', duracion: 90 },
                    { id_consulta: 3, motivo: 'Sesión de Emergencia', duracion: 30 },
                ],
            });
        }
    }
    async findAll(res) {
        try {
            const result = await this.bookingsService.findAll();
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener reservas',
                error: error.message,
            });
        }
    }
    async cleanDuplicates(req, res) {
        try {
            const result = await this.bookingsService.cleanDuplicateCancelledBookings(req.user.id_psicologa);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al limpiar duplicados',
                error: error.message,
            });
        }
    }
    async getReservasByPaciente(id_paciente, res, req) {
        try {
            console.log('🔍 Obteniendo reservas para paciente:', id_paciente);
            console.log('👤 Usuario autenticado:', req.user);
            if (req.user.tipo === 'paciente' && req.user.id_paciente !== parseInt(id_paciente)) {
                return res.status(common_1.HttpStatus.FORBIDDEN).json({
                    success: false,
                    message: 'No tienes permiso para ver estas reservas',
                });
            }
            const reservas = await this.bookingsService.findByPaciente(parseInt(id_paciente));
            return res.status(common_1.HttpStatus.OK).json(reservas || []);
        }
        catch (error) {
            console.error('Error obteniendo reservas del paciente:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener reservas',
                error: error.message,
            });
        }
    }
    async findByPsicologa(id_psicologa, req, res) {
        try {
            if (req.user.id_psicologa !== +id_psicologa) {
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                    success: false,
                    message: 'No puedes ver las reservas de otras psicólogas',
                });
            }
            const result = await this.bookingsService.findByPsicologa(+id_psicologa);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener reservas de psicóloga',
                error: error.message,
            });
        }
    }
    async createByPsychologist(createBookingDto, req, res) {
        try {
            console.log('👩‍⚕️ Psicóloga creando reserva');
            if (req.user.id_psicologa !== createBookingDto.id_psicologa) {
                return res.status(common_1.HttpStatus.FORBIDDEN).json({
                    success: false,
                    message: 'Solo puedes crear reservas en tu propio calendario',
                });
            }
            const result = await this.bookingsService.createByPsychologist(createBookingDto, req.user);
            return res.status(common_1.HttpStatus.CREATED).json(result);
        }
        catch (error) {
            console.error('💥 ERROR creando reserva psicóloga:', error);
            let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            let message = 'Error al crear la reserva';
            if (error instanceof common_1.BadRequestException) {
                status = common_1.HttpStatus.BAD_REQUEST;
                message = error.message;
            }
            else if (error instanceof common_1.ConflictException) {
                status = common_1.HttpStatus.CONFLICT;
                message = error.message;
            }
            else if (error instanceof common_1.NotFoundException) {
                status = common_1.HttpStatus.NOT_FOUND;
                message = error.message;
            }
            else if (error instanceof common_1.ForbiddenException) {
                status = common_1.HttpStatus.FORBIDDEN;
                message = error.message;
            }
            return res.status(status).json({
                success: false,
                message,
                error: error.message,
            });
        }
    }
    async findOne(id, res) {
        try {
            const result = await this.bookingsService.findOne(+id);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener reserva',
                error: error.message,
            });
        }
    }
    async update(id, updateBookingDto, res) {
        try {
            const result = await this.bookingsService.update(+id, updateBookingDto);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al actualizar reserva',
                error: error.message,
            });
        }
    }
    async cancel(id, req, res) {
        try {
            console.log('📥 === SOLICITUD DE CANCELACIÓN RECIBIDA ===');
            console.log('📍 URL:', req.url);
            console.log('🔐 Usuario:', req.user.email);
            console.log('🎯 Método:', req.method);
            console.log('🆔 ID Reserva:', id);
            const resultado = await this.bookingsService.cancelBooking(+id, req.user);
            console.log('✅ Cancelación exitosa');
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                message: 'Reserva cancelada exitosamente',
                reserva: resultado,
            });
        }
        catch (error) {
            console.error('❌ Error cancelando reserva:', error);
            let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            let message = 'Error al cancelar la reserva';
            if (error instanceof common_1.NotFoundException) {
                status = common_1.HttpStatus.NOT_FOUND;
                message = error.message;
            }
            else if (error instanceof common_1.ForbiddenException) {
                status = common_1.HttpStatus.FORBIDDEN;
                message = error.message;
            }
            else if (error instanceof common_1.BadRequestException) {
                status = common_1.HttpStatus.BAD_REQUEST;
                message = error.message;
            }
            return res.status(status).json({
                success: false,
                message,
                error: error.message,
            });
        }
    }
    async getAvailabilityDetailed(id_psicologa, date, res) {
        try {
            if (!id_psicologa || !date) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Se requieren los parámetros id_psicologa y date',
                });
            }
            const result = await this.bookingsService.getAvailabilityDetailed(+id_psicologa, date);
            return res.status(common_1.HttpStatus.OK).json(result);
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al obtener disponibilidad detallada',
                error: error.message,
            });
        }
    }
    async remove(id, res) {
        try {
            const result = await this.bookingsService.remove(+id);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                message: 'Reserva eliminada exitosamente',
                reserva: result,
            });
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al eliminar reserva',
                error: error.message,
            });
        }
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Get)('availability'),
    __param(0, (0, common_1.Query)('id_psicologa')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)('check-slot'),
    __param(0, (0, common_1.Query)('id_psicologa')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('hora')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "checkTimeSlot", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('available-slots'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('id_psicologa')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('id_consulta')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getAvailableSlots", null);
__decorate([
    (0, common_1.Get)('consultas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getConsultas", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('clean-duplicates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cleanDuplicates", null);
__decorate([
    (0, common_1.Get)('paciente/:id_paciente'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id_paciente')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getReservasByPaciente", null);
__decorate([
    (0, common_1.Get)('psicologa/:id_psicologa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id_psicologa')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findByPsicologa", null);
__decorate([
    (0, common_1.Post)('psychologist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_by_psychologist_dto_1.CreateBookingByPsychologistDto, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "createByPsychologist", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_booking_dto_1.UpdateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('availability-detailed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('id_psicologa')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getAvailabilityDetailed", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, psicologa_guard_1.PsicologaGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "remove", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map