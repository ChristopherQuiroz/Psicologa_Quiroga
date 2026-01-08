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
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PsicologaGuard } from '../auth/guards/psicologa.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard, PsicologaGuard)
export class ScheduleController {
  prisma: any;
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('blocks')
  createBlock(@Body() createBlockDto: CreateBlockDto) {
    return this.scheduleService.createBlock(createBlockDto);
  }

  @Get('blocks')
  findAllBlocks(@Query('id_psicologa') id_psicologa?: string) {
    return this.scheduleService.findAllBlocks(
      id_psicologa ? +id_psicologa : undefined,
    );
  }

  @Get('blocks/:id')
  findBlockById(@Param('id') id: string) {
    return this.scheduleService.findBlockById(+id);
  }

  @Patch('blocks/:id')
  updateBlock(
    @Param('id') id: string,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    return this.scheduleService.updateBlock(+id, updateBlockDto);
  }

  @Delete('blocks/:id')
  removeBlock(@Param('id') id: string) {
    return this.scheduleService.removeBlock(+id);
  }

  @Get('working-hours/:id_psicologa')
  getWorkingHours(@Param('id_psicologa') id_psicologa: string) {
    return this.scheduleService.getWorkingHours(+id_psicologa);
  }

  @Post('working-hours/:id_psicologa')
  setWorkingHours(
    @Param('id_psicologa') id_psicologa: string,
    @Body() workingHours: any,
  ) {
    return this.scheduleService.setWorkingHours(+id_psicologa, workingHours);
  }

  // Obtener bloqueos de una psicóloga
  @Get('bloqueos/:id_psicologa')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async getBloqueos(@Param('id_psicologa') id_psicologa: string) {
    return this.prisma.bloqueo.findMany({
      where: {
        id_psicologa: parseInt(id_psicologa),
      },
      orderBy: {
        inicio: 'asc',
      },
    });
  }

  // Crear bloqueo
  @Post('bloqueos')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async createBloqueo(@Body() createBloqueoDto: any, @Req() req) {
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

  // Eliminar bloqueo
  @Delete('bloqueos/:id_bloqueo')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async deleteBloqueo(@Param('id_bloqueo') id_bloqueo: string, @Req() req) {
    return this.prisma.bloqueo.delete({
      where: {
        id_bloqueo: parseInt(id_bloqueo),
        id_psicologa: req.user.id_psicologa,
      },
    });
  }

  // Obtener horario de trabajo
  @Get('horario/:id_psicologa')
  @UseGuards(JwtAuthGuard, PsicologaGuard)
  async getHorario(@Param('id_psicologa') id_psicologa: string) {
    // Por ahora, devolvemos un horario por defecto
    // En una implementación real, tendrías una tabla para horarios de trabajo
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
}