import { IsInt, IsDateString, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsNotEmpty()
  id_psicologa: number;

  @IsInt()
  @IsNotEmpty()
  id_consulta: number;

  @IsDateString()
  @IsNotEmpty()
  fecha: string; // Formato: YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  hora: string; // Formato: HH:MM

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}