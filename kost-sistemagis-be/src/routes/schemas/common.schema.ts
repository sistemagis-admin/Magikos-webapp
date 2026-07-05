// src/routes/schemas/common.schema.ts

export const errorResponseSchema = {
  type: 'object',
  description: 'Bad Request / Validation Error Response',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VALIDATION_FAILED' },
        message: { type: 'string', example: 'Invalid request payload format.' },
        details: {
          type: 'array',
          nullable: true,
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string' },
              instancePath: { type: 'string' },
              schemaPath: { type: 'string' },
              params: { type: 'object' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

export const unauthorizedResponseSchema = {
  type: 'object',
  description: 'Unauthorized Error Response',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'UNAUTHORIZED' },
        message: { type: 'string', example: 'You must be logged in to perform this action.' }
      }
    }
  }
};

export const forbiddenResponseSchema = {
  type: 'object',
  description: 'Forbidden / Permission Denied Response',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'FORBIDDEN' },
        message: { type: 'string', example: 'You do not have permission to manage this kost building.' }
      }
    }
  }
};

export const notFoundResponseSchema = {
  type: 'object',
  description: 'Resource Not Found Response',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'ROOM_NOT_FOUND' },
        message: { type: 'string', example: 'The requested room could not be found.' }
      }
    }
  }
};

export const internalServerErrorSchema = {
  type: 'object',
  description: 'Internal Server Error Response',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
        message: { type: 'string', example: 'An internal server error occurred.' }
      }
    }
  }
};

export const standardErrorResponses = {
  400: errorResponseSchema,
  401: unauthorizedResponseSchema,
  403: forbiddenResponseSchema,
  404: notFoundResponseSchema,
  500: internalServerErrorSchema
};
