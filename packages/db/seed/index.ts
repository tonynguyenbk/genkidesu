import { PrismaClient } from '@prisma/client';
import { foods } from './foods.js';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.food.count();
  if (count > 0) {
    console.log(`Foods already seeded (${count} records), skipping.`);
    return;
  }

  await prisma.food.createMany({ data: foods });
  console.log(`Seeded ${foods.length} foods`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
