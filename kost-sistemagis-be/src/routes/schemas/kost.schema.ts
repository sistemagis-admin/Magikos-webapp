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
  }
};
