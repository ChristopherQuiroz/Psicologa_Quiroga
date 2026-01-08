import type { Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateBookingByPsychologistDto } from './dto/create-booking-by-psychologist.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    getAvailability(id_psicologa: string, date: string, res: Response): Promise<Response<any, Record<string, any>>>;
    checkTimeSlot(id_psicologa: string, date: string, hora: string, res: Response): Promise<Response<any, Record<string, any>>>;
    create(createBookingDto: CreateBookingDto, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getAvailableSlots(id_psicologa: string, date: string, id_consulta: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getConsultas(res: Response): Promise<Response<any, Record<string, any>>>;
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    cleanDuplicates(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getReservasByPaciente(id_paciente: string, res: Response, req: any): Promise<Response<any, Record<string, any>>>;
    findByPsicologa(id_psicologa: string, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    createByPsychologist(createBookingDto: CreateBookingByPsychologistDto, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    update(id: string, updateBookingDto: UpdateBookingDto, res: Response): Promise<Response<any, Record<string, any>>>;
    cancel(id: string, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getAvailabilityDetailed(id_psicologa: string, date: string, res: Response): Promise<Response<any, Record<string, any>>>;
    remove(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
