import { standardErrorResponses } from './common.schema';

const roomProperties = {
  id: { type: 'string' },
  number: { type: 'string' },
  status: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED'] },
  monthlyPrice: { type: 'number' },
  kostId: { type: 'string' },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' }
};

const roomWithResidentsProperties = {
  ...roomProperties,
  residents: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string', nullable: true },
        avatarUrl: { type: 'string', nullable: true }
      }
    }
  }
};

export const getRoomsSchema = {
  tags: ['Room'],
  summary: 'List all rooms',
  description: 'Retrieves a paginated list of rooms with optional filters.',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'string', pattern: '^[0-9]+$', default: '1', description: 'Page number for pagination' },
      limit: { type: 'string', pattern: '^[0-9]+$', default: '10', description: 'Limit number of items per page' },
      search: { type: 'string', description: 'Search term by room number' },
      status: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED'], description: 'Filter by availability status' },
      kostId: { type: 'string', description: 'Filter by kost building ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: roomWithResidentsProperties
          }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};

export const getRoomSchema = {
  tags: ['Room'],
  summary: 'Get room details',
  description: 'Retrieves specs and active residents list for a specific room.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: roomWithResidentsProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const createRoomSchema = {
  tags: ['Room'],
  summary: 'Create a new room',
  description: 'Registers a new room in a specific kost building.',
  body: {
    type: 'object',
    required: ['number', 'monthlyPrice', 'kostId'],
    properties: {
      number: { type: 'string', description: 'Room number or name (e.g. 101, A-2)' },
      status: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED'], default: 'AVAILABLE', description: 'Availability status' },
      monthlyPrice: { type: 'number', minimum: 0, description: 'Monthly rental price in IDR' },
      kostId: { type: 'string', description: 'ID of the kost building this room belongs to' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: roomProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const updateRoomSchema = {
  tags: ['Room'],
  summary: 'Update room details',
  description: 'Modifies properties of an existing room.',
  body: {
    type: 'object',
    properties: {
      number: { type: 'string', description: 'Room number or name' },
      status: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED'], description: 'Availability status' },
      monthlyPrice: { type: 'number', minimum: 0, description: 'Monthly rental price in IDR' },
      kostId: { type: 'string', description: 'ID of the kost building' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: roomProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const deleteRoomSchema = {
  tags: ['Room'],
  summary: 'Delete a room',
  description: 'Deletes a specific room by ID. Fails if there are active residents or payment histories.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Room deleted successfully.' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};
