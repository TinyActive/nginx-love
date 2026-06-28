import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

export async function runSeedSafe(): Promise<void> {
  console.log('🌱 Starting safe database seed...');
  console.log('ℹ️  This script will only create data that doesn\'t exist yet');

  const existingUsers = await prisma.user.count();
  console.log(`Found ${existingUsers} existing users`);

  if (existingUsers === 0) {
    console.log('Creating default users...');

    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        fullName: 'System Administrator',
        role: 'admin',
        status: 'active',
        isFirstLogin: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        phone: '+84 123 456 789',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
        lastLogin: new Date(),
        profile: {
          create: {
            bio: 'System administrator with full access',
          },
        },
      },
    });

    const operatorPassword = await hashPassword('operator123');
    await prisma.user.create({
      data: {
        username: 'operator',
        email: 'operator@example.com',
        password: operatorPassword,
        fullName: 'System Operator',
        role: 'moderator',
        status: 'active',
        isFirstLogin: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=operator',
        phone: '+84 987 654 321',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'en',
        lastLogin: new Date(Date.now() - 86400000),
        profile: { create: { bio: 'System operator' } },
      },
    });

    const viewerPassword = await hashPassword('viewer123');
    await prisma.user.create({
      data: {
        username: 'viewer',
        email: 'viewer@example.com',
        password: viewerPassword,
        fullName: 'Read Only User',
        role: 'viewer',
        status: 'active',
        isFirstLogin: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
        timezone: 'Asia/Singapore',
        language: 'en',
        lastLogin: new Date(Date.now() - 172800000),
        profile: { create: { bio: 'Read-only access user' } },
      },
    });

    console.log('✅ Default users created successfully!');

    await prisma.activityLog.createMany({
      data: [
        {
          userId: admin.id,
          action: 'User logged in',
          type: 'login',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(Date.now() - 3600000),
          success: true,
        },
        {
          userId: admin.id,
          action: 'System initialized',
          type: 'system',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          details: 'Initial system setup completed',
          success: true,
        },
      ],
    });

    console.log('\n📝 Default credentials:');
    console.log('  admin / admin123 (admin)');
    console.log('  operator / operator123 (moderator)');
    console.log('  viewer / viewer123 (viewer)');
  } else {
    console.log('ℹ️  Users already exist, skipping user creation');
  }

  const existingCRSRules = await prisma.modSecCRSRule.count();
  if (existingCRSRules === 0) {
    console.log('Creating ModSecurity CRS rules...');
    await prisma.modSecCRSRule.createMany({
      data: [
        { ruleFile: 'REQUEST-942-APPLICATION-ATTACK-SQLI.conf', name: 'SQL Injection Protection', category: 'SQLi', description: 'Detects SQL injection attempts', enabled: true, paranoia: 1 },
        { ruleFile: 'REQUEST-941-APPLICATION-ATTACK-XSS.conf', name: 'XSS Attack Prevention', category: 'XSS', description: 'Blocks cross-site scripting attacks', enabled: true, paranoia: 1 },
        { ruleFile: 'REQUEST-932-APPLICATION-ATTACK-RCE.conf', name: 'RCE Detection', category: 'RCE', description: 'Remote code execution prevention', enabled: true, paranoia: 1 },
        { ruleFile: 'REQUEST-930-APPLICATION-ATTACK-LFI.conf', name: 'LFI Protection', category: 'LFI', description: 'Local file inclusion prevention', enabled: false, paranoia: 1 },
        { ruleFile: 'REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION.conf', name: 'Session Fixation', category: 'SESSION-FIXATION', description: 'Prevents session fixation attacks', enabled: true, paranoia: 1 },
        { ruleFile: 'REQUEST-933-APPLICATION-ATTACK-PHP.conf', name: 'PHP Attacks', category: 'PHP', description: 'PHP-specific attack prevention', enabled: true, paranoia: 1 },
        { ruleFile: 'REQUEST-920-PROTOCOL-ENFORCEMENT.conf', name: 'Protocol Attacks', category: 'PROTOCOL-ATTACK', description: 'HTTP protocol attack prevention', enabled: true, paranoia: 1 },
        { ruleFile: 'RESPONSE-950-DATA-LEAKAGES.conf', name: 'Data Leakage', category: 'DATA-LEAKAGES', description: 'Prevents sensitive data leakage', enabled: false, paranoia: 1 },
        { ruleFile: 'REQUEST-934-APPLICATION-ATTACK-GENERIC.conf', name: 'SSRF Protection', category: 'SSRF', description: 'SSRF prevention', enabled: true, paranoia: 1 },
        { ruleFile: 'RESPONSE-955-WEB-SHELLS.conf', name: 'Web Shell Detection', category: 'WEB-SHELL', description: 'Detects web shell uploads', enabled: true, paranoia: 1 },
      ],
    });
    console.log('✅ ModSecurity CRS rules created');
  }

  console.log('✅ Safe database seed completed');
  await prisma.$disconnect();
}

if (require.main === module) {
  runSeedSafe().catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  });
}
