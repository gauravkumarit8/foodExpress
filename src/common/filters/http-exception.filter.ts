import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Fix: every rejected request used to log at ERROR severity, including
    // completely normal ones (wrong password, 403, 409 duplicate). That
    // buries the thing ERROR should mean — a 500, a DB failure — in noise.
    // 4xx is a client mistake, not an application problem; only 5xx is.
    const logMessage = `${request.method} ${request.url} -> ${status}`;
    const stack = exception instanceof Error ? exception.stack : undefined;
    if (status >= 500) {
      this.logger.error(logMessage, stack);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
