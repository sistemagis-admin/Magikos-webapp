import { standardErrorResponses } from './common.schema';

const kostProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  type: { type: 'string' },
  description: { type: 'string', nullable: true },
  address: { type: 'string' },
  city: { type: 'string', nullable: true },
  province: { type: 'string', nullable: true },
  postalCode: { type: 'string', nullable: true },
  contactName: { type: 'string', nullable: true },
  contactPhone: { type: 'string', nullable: true },
  bankName: { type: 'string', nullable: true },
  bankAccount: { type: 'string', nullable: true },
  bankAccountName: { type: 'string', nullable: true },
  imageUrl: { type: 'string', nullable: true },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' }
};

export const getKostsSchema = {
  tags: ['Kost'],
  summary: 'List all kost buildings',
  description: 'Retrieves all kost buildings. For KostManagers, results are filtered to their managed buildings.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: kostProperties
          }
        }
      }
    },
    ...standardErrorResponses
  }
};

export const getKostSchema = {
  tags: ['Kost'],
  summary: 'Get kost building details',
  description: 'Retrieves details of a specific kost building by ID.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: kostProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const createKostSchema = {
  tags: ['Kost'],
  summary: 'Create a new kost building',
  description: 'Registers a new kost (boarding house) building with metadata and contact details.',
  body: {
    type: 'object',
    required: ['name', 'type', 'address'],
    properties: {
      name: { type: 'string', description: 'Name of the kost (e.g. Kost Mawar)' },
      type: { type: 'string', description: 'Type of kost (e.g. PUTRA, PUTRI, CAMPUR)' },
      description: { type: 'string', nullable: true, description: 'Optional description of the kost' },
      address: { type: 'string', description: 'Full address' },
      city: { type: 'string', nullable: true, description: 'City name' },
      province: { type: 'string', nullable: true, description: 'Province name' },
      postalCode: { type: 'string', nullable: true, description: 'Postal code' },
      contactName: { type: 'string', nullable: true, description: 'Manager/owner contact name' },
      contactPhone: { type: 'string', nullable: true, description: 'Manager/owner contact phone number' },
      bankName: { type: 'string', nullable: true, description: 'Bank name for rent transfer' },
      bankAccount: { type: 'string', nullable: true, description: 'Bank account number' },
      bankAccountName: { type: 'string', nullable: true, description: 'Bank account owner name' },
      imageUrl: { type: 'string', nullable: true, description: 'Kost main building image URL' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: kostProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const updateKostSchema = {
  tags: ['Kost'],
  summary: 'Update kost building details',
  description: 'Modifies properties of an existing kost building.',
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the kost' },
      type: { type: 'string', description: 'Type of kost' },
      description: { type: 'string', nullable: true, description: 'Optional description' },
      address: { type: 'string', description: 'Full address' },
      city: { type: 'string', nullable: true, description: 'City name' },
      province: { type: 'string', nullable: true, description: 'Province name' },
      postalCode: { type: 'string', nullable: true, description: 'Postal code' },
      contactName: { type: 'string', nullable: true, description: 'Manager/owner contact name' },
      contactPhone: { type: 'string', nullable: true, description: 'Manager/owner contact phone number' },
      bankName: { type: 'string', nullable: true, description: 'Bank name for transfer' },
      bankAccount: { type: 'string', nullable: true, description: 'Bank account number' },
      bankAccountName: { type: 'string', nullable: true, description: 'Bank account owner name' },
      imageUrl: { type: 'string', nullable: true, description: 'Kost main building image URL' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: kostProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const deleteKostSchema = {
  tags: ['Kost'],
  summary: 'Delete a kost building',
  description: 'Deletes a specific kost building by ID.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Kost deleted successfully.' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};
