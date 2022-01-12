// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { MongoError } from 'mongodb';
import { Error } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof MongoError
        ? 400
        : exception instanceof Error
        ? 400
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // console.log(exception instanceof Error)
    let mongoDuplicate;
    if (exception.code === 11000) {
      if (Object.keys(exception.keyValue) == 'email') {
        mongoDuplicate = 'This email has already been registered!';
      } else {
        mongoDuplicate = `Data associated with this ${Object.keys(
          exception.keyValue,
        )}: '${Object.values(exception.keyValue)}' already exists!`;
      }
    }

    console.log(exception);
    response.status(status).json({
      status: 'Fail',
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        exception.code == 11000
          ? mongoDuplicate
          : exception.status == 413 && exception.message == 'File too large'
          ? 'File too large! Max file-size : 10 MegaBytes.'
          : exception instanceof BadRequestException
          ? exception.response.message[0]
          : exception instanceof Error
          ? exception.reason?.message
          : exception.response?.message
          ? exception.response.message
          : exception.message
          ? exception.message
          : 'Something Went Wrong',
    });
  }
}
