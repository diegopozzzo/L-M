export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options?: { code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options?.code ?? "APP_ERROR";
    this.details = options?.details;
  }
}
