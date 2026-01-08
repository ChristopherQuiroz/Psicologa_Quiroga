import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Res,
  HttpStatus,
  Put,
  ConflictException,
} from '@nestjs/common';
import type { Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PsicologaGuard } from '../auth/guards/psicologa.guard';
import { CreateBookingByPsychologistDto } from './dto/create-booking-by-psychologist.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ==================== ENDPOINTS PÚBLICOS ====================

  @Get('availability')
  async getAvailability(
    @Query('id_psicologa') id_psicologa: string,
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    try {
      if (!id_psicologa || !date) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Se requieren los parámetros id_psicologa y date',
        });
      }
      
      const result = await this.bookingsService.getAvailability(+id_psicologa, date);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener disponibilidad',
        error: error.message,
      });
    }
  }

  @Get('check-slot')
  async checkTimeSlot(
    @Query('id_psicologa') id_psicologa: string,
    @Query('date') date: string,
    @Query('hora') hora: string,
    @Res() res: Response,
  ) {
    try {
      if (!id_psicologa || !date || !hora) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Se requieren id_psicologa, date y hora',
        });
      }

      const result = await this.bookingsService.checkTimeSlot(
        +id_psicologa,
        date,
        hora
      );
      
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al verificar disponibilidad del slot',
        error: error.message,
      });
    }
  }

  // ==================== ENDPOINTS PROTEGIDOS ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req, @Res() res: Response) {
    try {
      console.log('📥 Solicitud de creación de reserva desde PACIENTE');
      console.log('🔐 Usuario del token:', req.user);
      console.log('📋 Body recibido:', createBookingDto);
      
      if (req.user.tipo !== 'paciente') {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Solo los pacientes pueden crear reservas',
        });
      }
      
      if (!req.user.id_paciente) {
        console.error('❌ Token NO contiene id_paciente:', req.user);
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Token inválido: no contiene id_paciente',
        });
      }
      
      // Crear objeto de datos de reserva SIN el id_paciente del body
      const bookingData = {
        fecha: createBookingDto.fecha,
        hora: createBookingDto.hora,
        id_psicologa: createBookingDto.id_psicologa,
        id_consulta: createBookingDto.id_consulta,
        motivo: createBookingDto.motivo,
        id_paciente: req.user.id_paciente, // Solo del token
      };
      
      console.log('📊 Datos completos para crear reserva:', bookingData);
      
      const result = await this.bookingsService.create(bookingData);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      console.error('💥 ERROR creando reserva:', error);
      
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al crear la reserva';
      
      if (error instanceof BadRequestException) {
        status = HttpStatus.BAD_REQUEST;
        message = error.message;
      } else if (error instanceof ConflictException) {
        status = HttpStatus.CONFLICT;
        message = error.message;
      } else if (error instanceof NotFoundException) {
        status = HttpStatus.NOT_FOUND;
        message = error.message;
      }
      
      return res.status(status).json({
        success: false,
        message,
        error: error.message,
      });
    }
  }

  @Get('available-slots')
  @UseGuards(JwtAuthGuard)
  async getAvailableSlots(
    @Query('id_psicologa') id_psicologa: string,
    @Query('date') date: string,
    @Query('id_consulta') id_consulta: string,
    @Res() res: Response,
  ) {
    try {
      if (!id_psicologa || !date || !id_consulta) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Se requieren id_psicologa, date e id_consulta',
        });
      }
      
      const result = await this.bookingsService.getAvailableSlots(
        +id_psicologa,
        date,
        +id_consulta
      );
      
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('💥 ERROR en available-slots:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener slots disponibles',
        error: error.message,
      });
    }
  }

  // ==================== NUEVO ENDPOINT PARA CONSULTAS ====================
  @Get('consultas')
  @UseGuards(JwtAuthGuard)
  async getConsultas(@Res() res: Response) {
    try {
      console.log('🔍 Solicitando tipos de consulta');
      const consultas = await this.bookingsService.getConsultas();
      return res.status(HttpStatus.OK).json(consultas);
    } catch (error) {
      console.error('💥 ERROR obteniendo consultas:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener tipos de consulta',
        error: error.message,
        // Enviar datos por defecto como fallback
        defaultConsultas: [
          { id_consulta: 1, motivo: 'Consulta Individual', duracion: 60 },
          { id_consulta: 2, motivo: 'Terapia de Pareja', duracion: 90 },
          { id_consulta: 3, motivo: 'Sesión de Emergencia', duracion: 30 },
        ],
      });
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async findAll(@Res() res: Response) {
    try {
      const result = await this.bookingsService.findAll();
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener reservas',
        error: error.message,
      });
    }
  }

  @Post('clean-duplicates')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async cleanDuplicates(@Req() req, @Res() res: Response) {
    try {
      const result = await this.bookingsService.cleanDuplicateCancelledBookings(req.user.id_psicologa);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al limpiar duplicados',
        error: error.message,
      });
    }
  }

  @Get('paciente/:id_paciente')
  @UseGuards(JwtAuthGuard)
  async getReservasByPaciente(
    @Param('id_paciente') id_paciente: string,
    @Res() res: Response,
    @Req() req
  ) {
    try {
      console.log('🔍 Obteniendo reservas para paciente:', id_paciente);
      console.log('👤 Usuario autenticado:', req.user);
      
      if (req.user.tipo === 'paciente' && req.user.id_paciente !== parseInt(id_paciente)) {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'No tienes permiso para ver estas reservas',
        });
      }
      
      const reservas = await this.bookingsService.findByPaciente(parseInt(id_paciente));
      return res.status(HttpStatus.OK).json(reservas || []);
    } catch (error) {
      console.error('Error obteniendo reservas del paciente:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener reservas',
        error: error.message,
      });
    }
  }

  @Get('psicologa/:id_psicologa')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async findByPsicologa(
    @Param('id_psicologa') id_psicologa: string, 
    @Req() req,
    @Res() res: Response
  ) {
    try {
      if (req.user.id_psicologa !== +id_psicologa) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'No puedes ver las reservas de otras psicólogas',
        });
      }
      const result = await this.bookingsService.findByPsicologa(+id_psicologa);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener reservas de psicóloga',
        error: error.message,
      });
    }
  }

  @Post('psychologist')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async createByPsychologist(
    @Body() createBookingDto: CreateBookingByPsychologistDto,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      console.log('👩‍⚕️ Psicóloga creando reserva');
      
      if (req.user.id_psicologa !== createBookingDto.id_psicologa) {
        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'Solo puedes crear reservas en tu propio calendario',
        });
      }
      
      const result = await this.bookingsService.createByPsychologist(createBookingDto, req.user);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      console.error('💥 ERROR creando reserva psicóloga:', error);
      
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al crear la reserva';
      
      if (error instanceof BadRequestException) {
        status = HttpStatus.BAD_REQUEST;
        message = error.message;
      } else if (error instanceof ConflictException) {
        status = HttpStatus.CONFLICT;
        message = error.message;
      } else if (error instanceof NotFoundException) {
        status = HttpStatus.NOT_FOUND;
        message = error.message;
      } else if (error instanceof ForbiddenException) {
        status = HttpStatus.FORBIDDEN;
        message = error.message;
      }
      
      return res.status(status).json({
        success: false,
        message,
        error: error.message,
      });
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.bookingsService.findOne(+id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener reserva',
        error: error.message,
      });
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.bookingsService.update(+id, updateBookingDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al actualizar reserva',
        error: error.message,
      });
    }
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Req() req,
    @Res() res: Response
  ) {
    try {
      console.log('📥 === SOLICITUD DE CANCELACIÓN RECIBIDA ===');
      console.log('📍 URL:', req.url);
      console.log('🔐 Usuario:', req.user.email);
      console.log('🎯 Método:', req.method);
      console.log('🆔 ID Reserva:', id);
      
      const resultado = await this.bookingsService.cancelBooking(+id, req.user);
      
      console.log('✅ Cancelación exitosa');
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Reserva cancelada exitosamente',
        reserva: resultado,
      });
    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error al cancelar la reserva';
      
      if (error instanceof NotFoundException) {
        status = HttpStatus.NOT_FOUND;
        message = error.message;
      } else if (error instanceof ForbiddenException) {
        status = HttpStatus.FORBIDDEN;
        message = error.message;
      } else if (error instanceof BadRequestException) {
        status = HttpStatus.BAD_REQUEST;
        message = error.message;
      }
      
      return res.status(status).json({
        success: false,
        message,
        error: error.message,
      });
    }
  }

  @Get('availability-detailed')
  @UseGuards(JwtAuthGuard)
  async getAvailabilityDetailed(
    @Query('id_psicologa') id_psicologa: string,
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    try {
      if (!id_psicologa || !date) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Se requieren los parámetros id_psicologa y date',
        });
      }
      
      const result = await this.bookingsService.getAvailabilityDetailed(+id_psicologa, date);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener disponibilidad detallada',
        error: error.message,
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.bookingsService.remove(+id);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Reserva eliminada exitosamente',
        reserva: result,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al eliminar reserva',
        error: error.message,
      });
    }
  }
}