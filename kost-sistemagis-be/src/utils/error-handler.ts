import { Prisma } from '../generated/prisma';

export interface FormattedError {
  statusCode: number;
  code: string;
  message: string;
}

/**
 * Menerjemahkan error Prisma menjadi format error API yang user-friendly.
 */
export function handlePrismaError(error: any): FormattedError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        return {
          statusCode: 409, // 409 Conflict
          code: 'UNIQUE_CONSTRAINT_FAILED',
          message: `The value for ${target} is already in use. Please use another value.`
        };
      }
      case 'P2025':
        return {
          statusCode: 404,
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record could not be found.'
        };
      case 'P2003':
        return {
          statusCode: 400,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Foreign key constraint failed (referenced relation not found).'
        };
      default:
        return {
          statusCode: 400,
          code: `DATABASE_ERROR_${error.code}`,
          message: `A database error occurred (Code: ${error.code}).`
        };
    }
  }

  if (error.name === 'PrismaClientInitializationError') {
    return {
      statusCode: 503,
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Failed to connect to the database. Please ensure your PostgreSQL database is running.'
    };
  }

  if (error.name === 'PrismaClientValidationError') {
    return {
      statusCode: 400,
      code: 'DATABASE_VALIDATION_ERROR',
      message: 'Input data format does not match the database schema.'
    };
  }

  return null;
}
