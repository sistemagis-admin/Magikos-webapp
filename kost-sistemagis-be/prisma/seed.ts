import "dotenv/config";
import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing data
  await prisma.systemAlert.deleteMany({});
  await prisma.rfidLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.resident.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.kostManager.deleteMany({});
  await prisma.kost.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned existing data.");

  // 1.5. Seed Roles and Permissions
  const superAdminRole = await prisma.role.create({
    data: {
      name: "SuperAdmin",
      description: "Super Administrator with all permissions",
    }
  });

  const staffRole = await prisma.role.create({
    data: {
      name: "Staff",
      description: "Staff member",
    }
  });

  const permissions = [
    { action: "manage", resource: "user" },
    { action: "read", resource: "user" },
    { action: "write", resource: "user" },
    { action: "manage", resource: "role" },
    { action: "read", resource: "role" },
    { action: "write", resource: "role" },
    { action: "manage", resource: "permission" },
    { action: "read", resource: "permission" },
    { action: "manage", resource: "room" },
    { action: "read", resource: "room" },
    { action: "write", resource: "room" },
    { action: "manage", resource: "resident" },
    { action: "read", resource: "resident" },
    { action: "write", resource: "resident" },
    { action: "manage", resource: "kost" },
    { action: "read", resource: "kost" },
    { action: "write", resource: "kost" },
    { action: "read", resource: "dashboard" },
    { action: "manage", resource: "iot" },
  ];

  for (const p of permissions) {
    const perm = await prisma.permission.create({ data: p });
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: perm.id
      }
    });
  }

  const admin = await prisma.user.create({
    data: {
      email: "admin@sistemagis.com",
      name: "Admin Sistemagis",
      role: "admin", 
      roleId: superAdminRole.id,
    }
  });

  console.log("Created Roles, Permissions, and Admin User.");

  // Create Kosts
  const kost1 = await prisma.kost.create({
    data: {
      name: "Kost Putra Merdeka",
      type: "PUTRA",
      address: "Jl. Merdeka No. 1, Jakarta Pusat",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      postalCode: "10110",
      contactName: "Bapak Budi",
      contactPhone: "08111111111",
      bankName: "BCA",
      bankAccount: "1234567890",
      bankAccountName: "Budi Santoso",
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop"
    }
  });

  const kost2 = await prisma.kost.create({
    data: {
      name: "Kost Putri Melati",
      type: "PUTRI",
      address: "Jl. Melati No. 2, Bandung",
      city: "Bandung",
      province: "Jawa Barat",
      postalCode: "40111",
      contactName: "Ibu Ani",
      contactPhone: "08222222222",
      bankName: "Mandiri",
      bankAccount: "0987654321",
      bankAccountName: "Ani Wijaya",
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1e52d33454?q=80&w=1974&auto=format&fit=crop"
    }
  });

  // Assign admin to kosts
  await prisma.kostManager.createMany({
    data: [
      { userId: admin.id, kostId: kost1.id },
      { userId: admin.id, kostId: kost2.id }
    ]
  });

  console.log("Created Kosts.");

  // Seed Rooms
  const roomsData = [];
  const occupiedRoomCount = 102;
  const totalRoomCount = 120;

  for (let i = 1; i <= totalRoomCount; i++) {
    const floor = Math.ceil(i / 20);
    const roomNum = (i % 20 === 0 ? 20 : i % 20).toString().padStart(2, '0');
    const number = `${floor}${roomNum}`;
    const status = i <= occupiedRoomCount ? "OCCUPIED" : "AVAILABLE";
    
    // Distribute rooms between Kost 1 and Kost 2
    const kostId = i <= 60 ? kost1.id : kost2.id;
    const monthlyPrice = number === "204" ? 1200.0 : (floor % 2 === 0 ? 1200.0 : 1000.0);

    roomsData.push({
      number,
      status,
      monthlyPrice,
      kostId
    });
  }

  await prisma.room.createMany({ data: roomsData });
  const rooms = await prisma.room.findMany({});
  console.log(`Created ${rooms.length} rooms.`);

  // Seed Residents
  const room204 = rooms.find(r => r.number === "204")!;
  const room102 = rooms.find(r => r.number === "102")!;
  const room301 = rooms.find(r => r.number === "301")!;

  const julian = await prisma.resident.create({
    data: {
      name: "Joko Susilo",
      email: "joko@example.com",
      phone: "081122334455",
      nik: "3171234567890001",
      gender: "MALE",
      roomId: room204.id,
      kostId: kost1.id
    }
  });

  const sarah = await prisma.resident.create({
    data: {
      name: "Siti Aminah",
      email: "siti@example.com",
      phone: "081233445566",
      nik: "3171234567890002",
      gender: "FEMALE",
      roomId: room102.id,
      kostId: kost1.id
    }
  });

  const michael = await prisma.resident.create({
    data: {
      name: "Maman Abdurahman",
      email: "maman@example.com",
      phone: "081344556677",
      nik: "3171234567890003",
      gender: "MALE",
      roomId: room301.id,
      kostId: room301.kostId
    }
  });

  // Generate more residents for remaining occupied rooms
  const occupiedRooms = rooms.filter(r => r.status === "OCCUPIED" && r.number !== "204" && r.number !== "102" && r.number !== "301");
  const otherResidentsData = occupiedRooms.map((room, index) => ({
    name: `Penghuni ${index + 4}`,
    email: `penghuni${index + 4}@example.com`,
    roomId: room.id,
    kostId: room.kostId
  }));

  await prisma.resident.createMany({ data: otherResidentsData });
  const allResidents = await prisma.resident.findMany({});
  console.log(`Created residents (${allResidents.length} total).`);

  // Payments
  await prisma.payment.createMany({
    data: [
      { residentId: julian.id, roomId: room204.id, kostId: room204.kostId, type: "RENT", amount: 1200, status: "PAID", paymentMethod: "TRANSFER" },
      { residentId: sarah.id, roomId: room102.id, kostId: room102.kostId, type: "RENT", amount: 1000, status: "PENDING" },
      { residentId: michael.id, roomId: room301.id, kostId: room301.kostId, type: "RENT", amount: 1000, status: "PAID", paymentMethod: "CASH" },
    ]
  });

  // RfidLogs
  await prisma.rfidLog.createMany({
    data: [
      { residentId: julian.id, kostId: room204.kostId, deviceName: "Main Entrance", status: "SUCCESS" },
      { residentId: sarah.id, kostId: room102.kostId, deviceName: "Main Entrance", status: "SUCCESS" },
      { residentId: michael.id, kostId: room301.kostId, deviceName: "Main Entrance", status: "SUCCESS" },
    ]
  });

  // SystemAlerts
  await prisma.systemAlert.createMany({
    data: [
      { type: "WARNING", message: "Water pump maintenance needed", kostId: kost1.id },
      { type: "INFO", message: "Monthly report generated", kostId: kost2.id }
    ]
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
