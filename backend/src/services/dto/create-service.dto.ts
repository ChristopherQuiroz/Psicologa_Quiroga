import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  motivo: string;

  @IsInt()
  @Min(15)
  duracion: number; // en minutos

  @IsInt()
  @Min(0)
  @IsOptional()
  precio: number; // en la moneda correspondiente
}