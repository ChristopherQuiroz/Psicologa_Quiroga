// backend/src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorDetails: any = {};
    
    console.error('🔥 EXCEPCIÓN CAPTURADA:', exception);
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorDetails = exceptionResponse;
      } else {
        message = exceptionResponse as string;
        errorDetails = { message };
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        name: exception.name,
        message: exception.message,
        stack: exception.stack?.split('\n').slice(0, 3) // Solo primeras 3 líneas
      };
    }
    
    // 📌 RESPUESTA DETALLADA que SIEMPRE incluye mensaje
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      details: errorDetails,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined
      })
    };
    
    console.error('📤 Enviando respuesta de error:', errorResponse);
    
    response
      .status(status)
      .json(errorResponse);
  }
}