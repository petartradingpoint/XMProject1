import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
  readonly error: string;
  readonly message: string;
  readonly status: number;
}

/**
 * Catches all exceptions and serializes them to the uniform `ErrorResponse`
 * shape defined by the OpenAPI contract: `{ error, message, status }`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = this.reasonPhrase(status);

      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        const rawMessage = body.message ?? exception.message;
        message = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : typeof rawMessage === 'string'
            ? rawMessage
            : JSON.stringify(rawMessage);
        if (typeof body.error === 'string') {
          error = body.error;
        }
      }
    }

    const responseBody: ErrorResponseBody = { error, message, status };
    response.status(status).json(responseBody);
  }

  private reasonPhrase(status: number): string {
    const phrase = HttpStatus[status];
    if (typeof phrase !== 'string') {
      return 'Error';
    }
    return phrase
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
