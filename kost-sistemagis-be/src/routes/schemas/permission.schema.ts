// src/routes/schemas/permission.schema.ts
import { standardErrorResponses } from './common.schema';

const permissionProperties = {
  id: { type: 'string' },
  action: { type: 'string' },
  resource: { type: 'string' },
  description: { type: 'string', nullable: true },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' }
};

export const getPermissionsSchema = {
  tags: ['Permission'],
  summary: 'List all system permissions',
  description: 'Retrieves all defined action-resource permissions available in KosMonitor RBAC.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: permissionProperties
          }
        }
      }
    },
    ...standardErrorResponses
  }
};

export const createPermissionSchema = {
  tags: ['Permission'],
  summary: 'Create a new permission entry',
  description: 'Registers a new action and resource pair (e.g., action: read, resource: room).',
  body: {
    type: 'object',
    required: ['action', 'resource'],
    properties: {
      action: { type: 'string', description: 'Action name (e.g., read, write, manage)' },
      resource: { type: 'string', description: 'Target resource (e.g., kost, room, resident, user)' },
      description: { type: 'string', nullable: true, description: 'Optional description of the permission' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: permissionProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const deletePermissionSchema = {
  tags: ['Permission'],
  summary: 'Delete a permission entry',
  description: 'Deletes a specific permission record by ID.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Permission deleted successfully.' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};
