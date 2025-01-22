import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Add your seed data here
  await prisma.user.upsert({
    where: { email: 'admin@fotisagro.com' },
    update: {},
    create: {
      email: 'admin@fotisagro.com',
      name: 'Admin User',
      role: 'admin',
      // Add other required fields
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 