import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.modSecRule.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.twoFactorAuth.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');

  // Create admin user (password: admin123)
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'admin',
      status: 'active',
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

  // Create moderator user (password: operator123)
  const operatorPassword = await hashPassword('operator123');
  const operator = await prisma.user.create({
    data: {
      username: 'operator',
      email: 'operator@example.com',
      password: operatorPassword,
      fullName: 'System Operator',
      role: 'moderator',
      status: 'inactive',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=operator',
      phone: '+84 987 654 321',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'en',
      lastLogin: new Date(Date.now() - 86400000), // 1 day ago
      profile: {
        create: {
          bio: 'System operator',
        },
      },
    },
  });

  // Create viewer user (password: viewer123)
  const viewerPassword = await hashPassword('viewer123');
  const viewer = await prisma.user.create({
    data: {
      username: 'viewer',
      email: 'viewer@example.com',
      password: viewerPassword,
      fullName: 'Read Only User',
      role: 'viewer',
      status: 'inactive',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
      timezone: 'Asia/Singapore',
      language: 'en',
      lastLogin: new Date(Date.now() - 172800000), // 2 days ago
      profile: {
        create: {
          bio: 'Read-only access user',
        },
      },
    },
  });

  console.log('Creating activity logs...');

  // Create activity logs for admin
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'User logged in',
        type: 'login',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        success: true,
      },
      {
        userId: admin.id,
        action: 'Updated domain configuration for api.example.com',
        type: 'config_change',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        details: 'Modified SSL settings and upstream configuration',
        success: true,
      },
      {
        userId: admin.id,
        action: 'Failed login attempt',
        type: 'security',
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        details: 'Invalid password',
        success: false,
      },
      {
        userId: admin.id,
        action: 'Created new ACL rule',
        type: 'user_action',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        details: 'Added IP blacklist rule for 192.168.1.200',
        success: true,
      },
      {
        userId: admin.id,
        action: 'Changed account password',
        type: 'security',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        success: true,
      },
    ],
  });

  console.log('Creating ModSecurity CRS rules...');

  // Create OWASP CRS rule configurations (metadata only, matching mock data - 10 rules)
  await prisma.modSecCRSRule.createMany({
    data: [
      {
        ruleFile: 'REQUEST-942-APPLICATION-ATTACK-SQLI.conf',
        name: 'SQL Injection Protection',
        category: 'SQLi',
        description: 'Detects SQL injection attempts using OWASP CRS detection rules',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-941-APPLICATION-ATTACK-XSS.conf',
        name: 'XSS Attack Prevention',
        category: 'XSS',
        description: 'Blocks cross-site scripting attacks',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-932-APPLICATION-ATTACK-RCE.conf',
        name: 'RCE Detection',
        category: 'RCE',
        description: 'Remote code execution prevention',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-930-APPLICATION-ATTACK-LFI.conf',
        name: 'LFI Protection',
        category: 'LFI',
        description: 'Local file inclusion prevention',
        enabled: false,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION.conf',
        name: 'Session Fixation',
        category: 'SESSION-FIXATION',
        description: 'Prevents session fixation attacks',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-933-APPLICATION-ATTACK-PHP.conf',
        name: 'PHP Attacks',
        category: 'PHP',
        description: 'PHP-specific attack prevention',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-920-PROTOCOL-ENFORCEMENT.conf',
        name: 'Protocol Attacks',
        category: 'PROTOCOL-ATTACK',
        description: 'HTTP protocol attack prevention',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'RESPONSE-950-DATA-LEAKAGES.conf',
        name: 'Data Leakage',
        category: 'DATA-LEAKAGES',
        description: 'Prevents sensitive data leakage',
        enabled: false,
        paranoia: 1
      },
      {
        ruleFile: 'REQUEST-934-APPLICATION-ATTACK-GENERIC.conf',
        name: 'SSRF Protection',
        category: 'SSRF',
        description: 'Server-side request forgery prevention (part of generic attacks)',
        enabled: true,
        paranoia: 1
      },
      {
        ruleFile: 'RESPONSE-955-WEB-SHELLS.conf',
        name: 'Web Shell Detection',
        category: 'WEB-SHELL',
        description: 'Detects web shell uploads',
        enabled: true,
        paranoia: 1
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  Email: admin@example.com');
  console.log('  Role: admin');
  console.log('\nOperator:');
  console.log('  Username: operator');
  console.log('  Password: operator123');
  console.log('  Email: operator@example.com');
  console.log('  Role: moderator');
  console.log('\nViewer:');
  console.log('  Username: viewer');
  console.log('  Password: viewer123');
  console.log('  Email: viewer@example.com');
  console.log('  Role: viewer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
