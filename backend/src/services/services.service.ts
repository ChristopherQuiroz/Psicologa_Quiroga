import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    return this.prisma.consulta.create({
      data: createServiceDto,
    });
  }

  async findAll() {
    return this.prisma.consulta.findMany({
      orderBy: { motivo: 'asc' },
    });
  }

  async findOne(id: number) {
    const service = await this.prisma.consulta.findUnique({
      where: { id_consulta: id },
    });

    if (!service) {
      throw new NotFoundException(`Consulta con ID ${id} no encontrada`);
    }

    return service;
  }

  async update(id: number, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id); // Verifica que existe

    return this.prisma.consulta.update({
      where: { id_consulta: id },
      data: updateServiceDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verifica que existe

    return this.prisma.consulta.delete({
      where: { id_consulta: id },
    });
  }
}