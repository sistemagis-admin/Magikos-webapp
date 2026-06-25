export const createResidentSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email', nullable: true },
      phone: { type: 'string', nullable: true },
      nik: { type: 'string', maxLength: 16, nullable: true },
      gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
      placeOfBirth: { type: 'string', nullable: true },
      dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
      identityAddress: { type: 'string', nullable: true },
      occupation: { type: 'string', nullable: true },
      institution: { type: 'string', nullable: true },
      emergencyContactName: { type: 'string', nullable: true },
      emergencyContactRelation: { type: 'string', nullable: true },
      emergencyContactPhone: { type: 'string', nullable: true },
      ktpUrl: { type: 'string', nullable: true },
      avatarUrl: { type: 'string', nullable: true },
      roomId: { type: 'string', nullable: true },
      userId: { type: 'string', nullable: true },
      kostId: { type: 'string' }
    }
  }
};

export const updateResidentSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email', nullable: true },
      phone: { type: 'string', nullable: true },
      nik: { type: 'string', maxLength: 16, nullable: true },
      gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true },
      placeOfBirth: { type: 'string', nullable: true },
      dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
      identityAddress: { type: 'string', nullable: true },
      occupation: { type: 'string', nullable: true },
      institution: { type: 'string', nullable: true },
      emergencyContactName: { type: 'string', nullable: true },
      emergencyContactRelation: { type: 'string', nullable: true },
      emergencyContactPhone: { type: 'string', nullable: true },
      ktpUrl: { type: 'string', nullable: true },
      avatarUrl: { type: 'string', nullable: true },
      roomId: { type: 'string', nullable: true },
      userId: { type: 'string', nullable: true },
      kostId: { type: 'string', nullable: true }
    }
  }
};
