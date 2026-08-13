import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({ method: 'GET', url: '/test' }),
      }),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs a 4xx at warn, not error — the actual fix', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter.catch(new BadRequestException('bad input'), mockHost);

    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('still logs a 5xx at error severity', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter.catch(new InternalServerErrorException('db down'), mockHost);

    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('treats a raw (non-Http) exception as a 500 logged at error', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    filter.catch(new Error('unexpected'), mockHost);
    expect(errorSpy).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });
});
