import { seedAdminUser, seedDemoClient } from './seed';

async function main() {
  console.log('🌱 Starting database seed...\n');
  
  await seedAdminUser();
  await seedDemoClient();
  
  console.log('\n✅ Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
