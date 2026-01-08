import { IsInt, IsNotEmpty, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateBookingByPsychologistDto {
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

  @IsInt()
  @IsNotEmpty()
  id_paciente: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}