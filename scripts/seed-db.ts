import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = 'omniqr_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

async function main() {
  console.log('🌱 Starting OmniQR Database Seeding...');

  // 1. Create Default Enterprise Team
  const team = await prisma.team.upsert({
    where: { slug: 'acme-enterprise-global' },
    update: {},
    create: {
      name: 'Acme Enterprise Global',
      slug: 'acme-enterprise-global',
      tier: 'ENTERPRISE',
    },
  });

  console.log('✅ Created/Verified Enterprise Team:', team.name);

  // 2. Create Naveen (Enterprise Admin Lead)
  const naveenUser = await prisma.user.upsert({
    where: { email: 'naveen@omniqr.online' },
    update: {},
    create: {
      name: 'Naveen',
      email: 'naveen@omniqr.online',
      passwordHash: hashPassword('NaveenPass123!'),
      tier: 'ENTERPRISE',
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: naveenUser.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      teamId: team.id,
      userId: naveenUser.id,
      role: 'ADMIN',
      permissions: JSON.stringify(['ALL_ACCESS']),
    },
  });

  console.log('✅ Created/Verified Admin Lead:', naveenUser.email);

  // 3. Create Alex Rivera (Workspace Owner)
  const alexUser = await prisma.user.upsert({
    where: { email: 'alex@acme.io' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'alex@acme.io',
      passwordHash: hashPassword('AlexPass123!'),
      tier: 'ENTERPRISE',
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: alexUser.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      teamId: team.id,
      userId: alexUser.id,
      role: 'OWNER',
      permissions: JSON.stringify(['ALL_ACCESS']),
    },
  });

  console.log('✅ Created/Verified Workspace Owner:', alexUser.email);

  // 4. Create API Keys
  const apiKey = await prisma.apiKey.upsert({
    where: { keyHash: hashPassword('sk_live_9a8f12345678') },
    update: {},
    create: {
      teamId: team.id,
      name: 'Production Server Token',
      keyHash: hashPassword('sk_live_9a8f12345678'),
      keyPrefix: 'sk_live_9a8f...',
    },
  });

  console.log('✅ Created/Verified API Key:', apiKey.name);

  console.log('✅ Created/Verified API Key:', apiKey.name);

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
