export const createKostSchema = {
  body: {
    type: 'object',
    required: ['name', 'type', 'address'],
    properties: {
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
      imageUrl: { type: 'string', nullable: true }
    }
  }
};

export const updateKostSchema = {
  body: {
    type: 'object',
    properties: {
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
      imageUrl: { type: 'string', nullable: true }
    }
  }
};
