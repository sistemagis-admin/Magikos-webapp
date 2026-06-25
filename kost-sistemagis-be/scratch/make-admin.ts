import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const role = await prisma.role.findFirst({ where: { name: 'SuperAdmin' } });
  if (role) {
    await prisma.user.update({
      where: { email: 'testadmin@sistemagis.com' },
      data: { role: 'admin', roleId: role.id }
    });
    console.log('Role updated to SuperAdmin');
  }
}
main().finally(() => prisma.$disconnect());
