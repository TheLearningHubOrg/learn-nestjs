import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';

/** RFC 9457 problem document (RFC 9457 obsoletes RFC 7807; the format is compatible). */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string | string[];
  instance: string;
  errorCode?: string;
  requestId?: string;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
      instance: request.originalUrl,
      requestId: request.header('x-request-id'),
    };

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        problem.detail = body;
      } else {
        const { message, errorCode } = body as { message?: string | string[]; errorCode?: string };
        problem.detail = message;
        if (errorCode) problem.errorCode = errorCode;
      }
    } else {
      // Never leak stack traces or driver messages to clients; log them instead.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
      problem.detail = 'An unexpected error occurred';
    }

    response.status(status).type('application/problem+json').json(problem);
  }
}
