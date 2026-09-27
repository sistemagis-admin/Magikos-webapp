// src/routes/schemas/user.schema.ts
import { standardErrorResponses } from './common.schema';

const userProperties = {
  id: { type: 'string' },
  name: { type: 'string', nullable: true },
  email: { type: 'string' },
  emailVerified: { type: 'boolean' },
  image: { type: 'string', nullable: true },
  role: { type: 'string', nullable: true },
  roleId: { type: 'string', nullable: true },
  banned: { type: 'boolean', nullable: true },
  banReason: { type: 'string', nullable: true },
  banExpires: { type: 'string', nullable: true },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' },
  roleRelation: {
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true }
    }
  }
};

export const getUsersSchema = {
  tags: ['User'],
  summary: 'List all user accounts',
  description: 'Retrieves a paginated list of user accounts with optional search filter.',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'string', pattern: '^[0-9]+$', default: '1' },
      limit: { type: 'string', pattern: '^[0-9]+$', default: '10' },
      search: { type: 'string', description: 'Search by name or email' }
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
            properties: userProperties
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

export const getUserSchema = {
  tags: ['User'],
  summary: 'Get user details by ID',
  description: 'Retrieves profile and role details of a specific user.',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'User account ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: userProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const createUserSchema = {
  tags: ['User'],
  summary: 'Create a new user account',
  description: 'Admin endpoint to register a user account and assign roles.',
  body: {
    type: 'object',
    required: ['email', 'name'],
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      password: { type: 'string', minLength: 8, description: 'Optional initial password. Defaults to defaultPassword123!' },
      roleId: { type: 'string', description: 'Assigned Role ID' },
      role: { type: 'string', description: 'Role name identifier' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: userProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const updateUserRoleSchema = {
  tags: ['User'],
  summary: 'Update user role assignment',
  description: 'Changes the role or roleId assigned to an existing user.',
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
      roleId: { type: 'string', nullable: true },
      role: { type: 'string', nullable: true }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: userProperties
        }
      }
    },
    ...standardErrorResponses
  }
};

export const deleteUserSchema = {
  tags: ['User'],
  summary: 'Delete user account',
  description: 'Deletes a user account. Cannot be used to delete oneself.',
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
            message: { type: 'string', example: 'User deleted successfully.' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};

export const banUserSchema = {
  tags: ['User'],
  summary: 'Ban / Deactivate user account',
  description: 'Deactivates a user account and immediately revokes all active sessions.',
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
      reason: { type: 'string', description: 'Deactivation reason' },
      expiresIn: { type: 'integer', description: 'Ban duration in seconds (optional)' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: userProperties
        },
        message: { type: 'string' }
      }
    },
    ...standardErrorResponses
  }
};

export const unbanUserSchema = {
  tags: ['User'],
  summary: 'Unban / Reactivate user account',
  description: 'Restores an account that was previously banned or deactivated.',
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
          properties: userProperties
        }
      }
    },
    ...standardErrorResponses
  }
};
