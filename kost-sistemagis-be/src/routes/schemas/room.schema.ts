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
  }
};
