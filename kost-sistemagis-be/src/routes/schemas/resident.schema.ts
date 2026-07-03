export const createResidentSchema = {
  tags: ['Resident'],
  summary: 'Register a new resident',
  description: 'Registers a new resident and optionally assigns them to a room in a kost building.',
  body: {
    type: 'object',
    required: ['name', 'kostId'],
    properties: {
      name: { type: 'string', description: 'Full name of the resident' },
      email: { type: 'string', format: 'email', nullable: true, description: 'Unique email address' },
      phone: { type: 'string', nullable: true, description: 'Phone number' },
      nik: { type: 'string', maxLength: 16, nullable: true, description: 'National Identity Number (NIK)' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true, description: 'Gender of the resident' },
      placeOfBirth: { type: 'string', nullable: true, description: 'Place of birth' },
      dateOfBirth: { type: 'string', format: 'date-time', nullable: true, description: 'Date of birth' },
      identityAddress: { type: 'string', nullable: true, description: 'Address on ID card' },
      occupation: { type: 'string', nullable: true, description: 'Occupation/Job' },
      institution: { type: 'string', nullable: true, description: 'Workplace or school/university' },
      emergencyContactName: { type: 'string', nullable: true, description: 'Emergency contact name' },
      emergencyContactRelation: { type: 'string', nullable: true, description: 'Relationship with emergency contact' },
      emergencyContactPhone: { type: 'string', nullable: true, description: 'Emergency contact phone number' },
      ktpUrl: { type: 'string', nullable: true, description: 'KTP ID card image URL' },
      avatarUrl: { type: 'string', nullable: true, description: 'Profile avatar image URL' },
      roomId: { type: 'string', nullable: true, description: 'Room ID assigned' },
      userId: { type: 'string', nullable: true, description: 'User account ID mapped to this resident' },
      kostId: { type: 'string', description: 'Kost building ID' }
    }
  }
};

export const updateResidentSchema = {
  tags: ['Resident'],
  summary: 'Update resident details',
  description: 'Modifies properties of an existing resident.',
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Full name of the resident' },
      email: { type: 'string', format: 'email', nullable: true, description: 'Unique email address' },
      phone: { type: 'string', nullable: true, description: 'Phone number' },
      nik: { type: 'string', maxLength: 16, nullable: true, description: 'National Identity Number (NIK)' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE'], nullable: true, description: 'Gender' },
      placeOfBirth: { type: 'string', nullable: true, description: 'Place of birth' },
      dateOfBirth: { type: 'string', format: 'date-time', nullable: true, description: 'Date of birth' },
      identityAddress: { type: 'string', nullable: true, description: 'Address on ID card' },
      occupation: { type: 'string', nullable: true, description: 'Occupation' },
      institution: { type: 'string', nullable: true, description: 'Workplace or school' },
      emergencyContactName: { type: 'string', nullable: true, description: 'Emergency contact name' },
      emergencyContactRelation: { type: 'string', nullable: true, description: 'Relationship' },
      emergencyContactPhone: { type: 'string', nullable: true, description: 'Emergency contact phone' },
      ktpUrl: { type: 'string', nullable: true, description: 'KTP ID card image URL' },
      avatarUrl: { type: 'string', nullable: true, description: 'Avatar image URL' },
      roomId: { type: 'string', nullable: true, description: 'Room ID assigned' },
      userId: { type: 'string', nullable: true, description: 'User account ID' },
      kostId: { type: 'string', nullable: true, description: 'Kost building ID' }
    }
  }
};

export const getResidentsSchema = {
  tags: ['Resident'],
  summary: 'List all residents',
  description: 'Retrieves a paginated list of residents with optional filters.',
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'string', pattern: '^[0-9]+$', default: '1', description: 'Page number for pagination' },
      limit: { type: 'string', pattern: '^[0-9]+$', default: '10', description: 'Limit number of items per page' },
      search: { type: 'string', description: 'Search term by name or email' },
      roomId: { type: 'string', description: 'Filter by room ID' },
      kostId: { type: 'string', description: 'Filter by kost building ID' }
    }
  }
};
