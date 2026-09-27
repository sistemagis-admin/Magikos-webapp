export const signUpSchema = {
  tags: ['Auth'],
  summary: 'Register a new user',
  description: 'Registers a new user with name, email, and password.',
  body: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email', description: 'Email address of the user' },
      password: { type: 'string', minLength: 8, description: 'Password, minimum 8 characters' },
      name: { type: 'string', description: 'Full name of the user' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'New session token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' },
                image: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

export const signInSchema = {
  tags: ['Auth'],
  summary: 'Sign in with email & password',
  description: 'Authenticates a user using email and password to obtain a session token.',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', description: 'Registered email address' },
      password: { type: 'string', description: 'Account password' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'Session token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                emailVerified: { type: 'boolean' },
                image: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                role: { type: 'string', nullable: true }
              }
            }
          }
        }
      }
    }
  }
};

export const signOutSchema = {
  tags: ['Auth'],
  summary: 'Sign out (Logout)',
  description: 'Revokes the currently active session token.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          nullable: true,
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        }
      }
    }
  }
};

export const getSessionSchema = {
  tags: ['Auth'],
  summary: 'Check active session',
  description: 'Retrieves the active session data and profile of the logged-in user.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          nullable: true,
          properties: {
            session: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                expiresAt: { type: 'string' },
                token: { type: 'string' }
              }
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', nullable: true }
              }
            }
          }
        }
      }
    }
  }
};
