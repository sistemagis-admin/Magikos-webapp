export const signUpSchema = {
  tags: ['Auth'],
  summary: 'Daftar pengguna baru',
  description: 'Mendaftarkan pengguna baru dengan email, kata sandi, dan nama.',
  body: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email', description: 'Alamat email pengguna' },
      password: { type: 'string', minLength: 8, description: 'Kata sandi minimal 8 karakter' },
      name: { type: 'string', description: 'Nama lengkap pengguna' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token sesi baru' },
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
};

export const signInSchema = {
  tags: ['Auth'],
  summary: 'Masuk dengan email & sandi',
  description: 'Autentikasi menggunakan email dan kata sandi untuk mendapatkan token sesi.',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', description: 'Alamat email terdaftar' },
      password: { type: 'string', description: 'Kata sandi akun' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token sesi login' },
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
};

export const signOutSchema = {
  tags: ['Auth'],
  summary: 'Keluar sesi (Logout)',
  description: 'Mencabut token sesi yang sedang aktif saat ini.',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  }
};

export const getSessionSchema = {
  tags: ['Auth'],
  summary: 'Cek sesi aktif',
  description: 'Mengambil data sesi aktif beserta profil pengguna yang sedang masuk.',
  response: {
    200: {
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
};
