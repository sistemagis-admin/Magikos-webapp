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
    { action: "read", resource: "dashboard" },   // Akses lihat dashboard
    { action: "manage", resource: "iot" },        // Akses kontrol IoT/RFID
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

  // Create an admin user
  await prisma.user.create({
    data: {
      email: "admin@sistemagis.com",
      name: "Admin Sistemagis",
      role: "admin", 
      roleId: superAdminRole.id,
    }
  });

  console.log("Created Roles, Permissions, and Admin User.");

  // 2. Seed Rooms (120 units total: 102 occupied, 18 available)
  const roomsData = [];
  const occupiedRoomCount = 102;
  const totalRoomCount = 120;

  for (let i = 1; i <= totalRoomCount; i++) {
    // Generate room number: e.g. 101-120, 201-220, etc.
    const floor = Math.ceil(i / 20);
    const roomNum = (i % 20 === 0 ? 20 : i % 20).toString().padStart(2, '0');
    const number = `${floor}${roomNum}`;
    const status = i <= occupiedRoomCount ? "OCCUPIED" : "AVAILABLE";
    
    // Rent price is $1,200 for room 204, let's make it standard $1,200 for all rooms or vary it slightly
    const monthlyPrice = number === "204" ? 1200.0 : (floor % 2 === 0 ? 1200.0 : 1000.0);

    roomsData.push({
      number,
      status,
      monthlyPrice,
    });
  }

  // Insert rooms and retrieve them
  await prisma.room.createMany({
    data: roomsData,
  });

  const rooms = await prisma.room.findMany({});
  console.log(`Created ${rooms.length} rooms.`);

  // 3. Seed Residents
  // We need to create specific residents:
  // - Julian Casablancas (Room 204)
  // - Sarah Jenkins (Room 102)
  // - Michael Scott (Room 301)
  const room204 = rooms.find(r => r.number === "204")!;
  const room102 = rooms.find(r => r.number === "102")!;
  const room301 = rooms.find(r => r.number === "301")!;

  const julian = await prisma.resident.create({
    data: {
      name: "Julian Casablancas",
      email: "julian@example.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDM_RUn04ydAnYRT6Ydu1E8No3B-X6rKQtF6RrXs_z0KRBLHO11tviJ2_UFagK4KGDun3mpkvZr-RItuAWa1jPeeTvE3mamRNZlkYXHIAnATZGyu3bCsZ2pihqGosga5s2WmrUH7Hw70qI5kOPGYRlbVkmvdjSOhJZg8FRi30ruZzS64b71R2A3n28X3QKbkR-PFb1pEAoe_aJ7J2bzl9OaaNJE9WqQLp816TBYw5sBp4gbwLaaIq5aAcEYu1U-OFDcI0fOxpC4uGc",
      roomId: room204.id,
    }
  });

  const sarah = await prisma.resident.create({
    data: {
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDG61WQ4AE3D8hjVsxkBV1eR4qdsfFzntbJCU-bfht6xMzNiU1xLRWHhE-JtXuMz4NTt6lQ5XTRfCMPuZf0aGszZi5owTY1nQ0-a_JJHHL9IyqENEsBc6MLx7QqgugXOStm0xXJrEoCSBpYftY7bxlqVBV6P8XEcdsr-vepT7EeL9TBQXeoj-tY17x9DlLB7FzCSIqTlaiwADcagkAl7FaQluJYEwVpD6R0NHWImCTyw9dyXg_xqx3O-TdjJtl3j4FreZZpjlRI928",
      roomId: room102.id,
    }
  });

  const michael = await prisma.resident.create({
    data: {
      name: "Michael Scott",
      email: "michael@example.com",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUMTX1KQrvKlxzofV2VXw8Yar2AcHVJhmR2Erf4ZW0E47T9Y1bE9lXC2Y6N4GRDZtkgvOr6bipB9Ix3Ktz8czts1stl3XOVpvguepJQeO3rXfJTGxNL326lxhKEB6_spyNyaGwl0Gi44kaiA3KhU7P4XJ6IZWtYn5fviHm584s9U7H4ho-m0LCenFxvrAQqIkNVbWLDj_ixxxijjrsHyDR4wEktYHqj3KO6qUaQq0VWWVVxoQd9ovVyZxJbm5fN2vGtg8WwYiTUZU",
      roomId: room301.id,
    }
  });

  // Generate 99 other mock residents to reach 102 occupied rooms
  const occupiedRoomsExceptSpecials = rooms.filter(r => r.status === "OCCUPIED" && r.number !== "204" && r.number !== "102" && r.number !== "301");
  
  const otherResidentsData = [];
  for (let j = 0; j < occupiedRoomsExceptSpecials.length; j++) {
    const room = occupiedRoomsExceptSpecials[j];
    otherResidentsData.push({
      name: `Resident Room ${room.number}`,
      email: `resident.${room.number}@example.com`,
      roomId: room.id,
    });
  }

  await prisma.resident.createMany({
    data: otherResidentsData,
  });

  console.log("Created residents (102 total occupied rooms).");

  // Get all residents to assign payments/logs
  const allResidents = await prisma.resident.findMany({});

  // 4. Seed Payments
  // Let's create recent payments:
  // - Rent Payment: Julian Casablancas (Room 204), amount $1200.00, PAID, Oct 23, 2023, TRANSFER
  // - Laundry Credit Top-up: Sarah Jenkins (Room 102), amount $50.00, PAID, Oct 23, 2023, CREDIT_CARD
  // - Electricity Surcharge: Michael Scott (Room 301), amount $125.00, PENDING, Oct 22, 2023

  const today = new Date();
  const oct23 = new Date(today.getFullYear(), 9, 23); // October is month index 9
  const oct22 = new Date(today.getFullYear(), 9, 22);

  await prisma.payment.create({
    data: {
      residentId: julian.id,
      roomId: room204.id,
      type: "RENT",
      amount: 1200.0,
      paymentMethod: "TRANSFER",
      status: "PAID",
      createdAt: oct23,
      updatedAt: oct23,
    }
  });

  await prisma.payment.create({
    data: {
      residentId: sarah.id,
      roomId: room102.id,
      type: "LAUNDRY",
      amount: 50.0,
      paymentMethod: "CREDIT_CARD",
      status: "PAID",
      createdAt: oct23,
      updatedAt: oct23,
    }
  });

  await prisma.payment.create({
    data: {
      residentId: michael.id,
      roomId: room301.id,
      type: "ELECTRICITY",
      amount: 125.0,
      status: "PENDING",
      createdAt: oct22,
      updatedAt: oct22,
      dueDate: new Date(today.getFullYear(), 10, 5), // Nov 5
    }
  });

  // Now seed historical payments to match monthly revenue growth:
  // May: 8200
  // Jun: 9100
  // Jul: 10500
  // Aug: 11200
  // Sep: 12100
  // Oct: 12500 (total paid, plus $1.2k outstanding which we already created for Michael + others)
  
  const monthlyRevenueTargets = [
    { month: 4, target: 8200 },  // May (index 4)
    { month: 5, target: 9100 },  // June
    { month: 6, target: 10500 }, // July
    { month: 7, target: 11200 }, // August
    { month: 8, target: 12100 }, // September
    { month: 9, target: 12500 - 1200 } // October (target paid: $11.3k, since Julian paid $1.2k, making it $12.5k total)
  ];

  for (const item of monthlyRevenueTargets) {
    const year = today.getFullYear();
    const date = new Date(year, item.month, 15);
    
    // We can split the target amount into a few payments from various residents
    let remainingAmount = item.target;
    let idx = 0;
    
    while (remainingAmount > 0 && idx < allResidents.length) {
      const resident = allResidents[idx];
      const amount = Math.min(1000.0, remainingAmount);
      
      await prisma.payment.create({
        data: {
          residentId: resident.id,
          roomId: resident.roomId,
          type: "RENT",
          amount: amount,
          paymentMethod: "TRANSFER",
          status: "PAID",
          createdAt: date,
          updatedAt: date,
        }
      });
      
      remainingAmount -= amount;
      idx++;
    }
  }

  // Create additional outstanding/pending payments for October (matching $1.2k outstanding)
  // Michael Scott already has $125.0 pending. Let's create another $1075.0 pending payments
  let remainingOutstanding = 1075.0;
  let oIdx = 5;
  while (remainingOutstanding > 0 && oIdx < allResidents.length) {
    const resident = allResidents[oIdx];
    const amount = Math.min(200.0, remainingOutstanding);
    await prisma.payment.create({
      data: {
        residentId: resident.id,
        roomId: resident.roomId,
        type: "RENT",
        amount: amount,
        status: "PENDING",
        createdAt: new Date(today.getFullYear(), 9, 20),
        updatedAt: new Date(today.getFullYear(), 9, 20),
        dueDate: new Date(today.getFullYear(), 10, 1),
      }
    });
    remainingOutstanding -= amount;
    oIdx++;
  }

  console.log("Created payments & historical data.");

  // 5. Seed RFID Logs
  // - Julian Casablancas: Room 204, Main Entrance, SUCCESS, 10:42 AM today
  // - Sarah Jenkins: Room 102, Laundry Area, SUCCESS, 10:35 AM today
  // - Michael Scott: Room 301, Main Entrance, DENIED, 10:15 AM today

  const todayBase = new Date();
  
  const timeJulian = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate(), 10, 42, 0);
  const timeSarah = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate(), 10, 35, 0);
  const timeMichael = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate(), 10, 15, 0);

  await prisma.rfidLog.create({
    data: {
      residentId: julian.id,
      deviceName: "Main Entrance",
      status: "SUCCESS",
      timestamp: timeJulian,
    }
  });

  await prisma.rfidLog.create({
    data: {
      residentId: sarah.id,
      deviceName: "Laundry Area",
      status: "SUCCESS",
      timestamp: timeSarah,
    }
  });

  await prisma.rfidLog.create({
    data: {
      residentId: michael.id,
      deviceName: "Main Entrance",
      status: "DENIED",
      timestamp: timeMichael,
    }
  });

  console.log("Created RFID access logs.");

  // 6. Seed System Alerts
  // - Warning: 12 residents have unpaid rent for the upcoming month.
  // - Danger: Main Gate RFID sensor disconnected at 09:12 AM.

  const timeAlert1 = new Date(todayBase.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const timeAlert2 = new Date(todayBase.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago

  await prisma.systemAlert.create({
    data: {
      type: "DANGER",
      message: "Main Gate RFID sensor disconnected at 09:12 AM.",
      timestamp: timeAlert1,
    }
  });

  await prisma.systemAlert.create({
    data: {
      type: "WARNING",
      message: "12 residents have unpaid rent for the upcoming month.",
      timestamp: timeAlert2,
    }
  });

  console.log("Created system alerts.");
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
