// src/routes/schemas/role.schema.ts
import { standardErrorResponses } from './common.schema';

const roleProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string', nullable: true },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' },
  permissions: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        roleId: { type: 'string' },
        permissionId: { type: 'string' },
        permission: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            action: { type: 'string' },
            resource: { type: 'string' },
            description: { type: 'string', nullable: true }
          }
        }
      }
    }
  }
};

export const getRolesSchema = {
  tags: ['Role'],
  summary: 'List all roles',
  description: 'Retrieves all defined user roles and their associated permissions.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: roleProperties
          }
        }
      }
    },
    ...standardErrorResponses
  }
};

export const createRoleSchema = {
  tags: ['Role'],
  summary: 'Create a new role',
  description: 'Creates a custom user role with optional initial permissions.',
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Unique name of the role' },
      description: { type: 'string', nullable: true, description: 'Role description' },
      permissionIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of Permission IDs to associate with this role'
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: roleProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const updateRoleSchema = {
  tags: ['Role'],
  summary: 'Update role details',
  description: 'Modifies the name or description of an existing role.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string', nullable: true }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: roleProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const deleteRoleSchema = {
  tags: ['Role'],
  summary: 'Delete a role',
  description: 'Deletes a role. Protected roles like SuperAdmin cannot be deleted.',
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
            message: { type: 'string', example: 'Role deleted successfully.' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};

export const updateRolePermissionsSchema = {
  tags: ['Role'],
  summary: 'Assign permissions to role',
  description: 'Replaces all permissions assigned to a role with a new list of permission IDs.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['permissionIds'],
    properties: {
      permissionIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'New array of permission IDs'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: roleProperties
        }
      }
    },
    ...standardErrorResponses
  }
};
