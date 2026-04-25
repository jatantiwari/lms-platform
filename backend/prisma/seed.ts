import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'web-development' },
      update: {},
      create: { name: 'Web Development', slug: 'web-development', icon: '💻' },
    }),
    prisma.category.upsert({
      where: { slug: 'data-science' },
      update: {},
      create: { name: 'Data Science', slug: 'data-science', icon: '📊' },
    }),
    prisma.category.upsert({
      where: { slug: 'mobile-development' },
      update: {},
      create: { name: 'Mobile Development', slug: 'mobile-development', icon: '📱' },
    }),
    prisma.category.upsert({
      where: { slug: 'cloud-devops' },
      update: {},
      create: { name: 'Cloud & DevOps', slug: 'cloud-devops', icon: '☁️' },
    }),
    prisma.category.upsert({
      where: { slug: 'design' },
      update: {},
      create: { name: 'Design', slug: 'design', icon: '🎨' },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lmsplatform.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@lmsplatform.com',
      password: await hashPassword('Admin@123'),
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Demo instructor
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@demo.com' },
    update: {},
    create: {
      name: 'Jane Doe',
      email: 'instructor@demo.com',
      password: await hashPassword('Instructor@123'),
      role: 'INSTRUCTOR',
      headline: 'Senior Software Engineer & Educator',
      bio: 'Passionate about teaching modern web technologies.',
      emailVerified: true,
    },
  });
  console.log(`✅ Instructor: ${instructor.email}`);

  // Demo student
  const student = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'student@demo.com',
      password: await hashPassword('Student@123'),
      role: 'STUDENT',
      emailVerified: true,
    },
  });
  console.log(`✅ Student: ${student.email}`);

  console.log('✅ Seeding complete!');
  console.log('\n📧 Test credentials:');
  console.log('  Admin:      admin@lmsplatform.com / Admin@123');
  console.log('  Instructor: instructor@demo.com / Instructor@123');
  console.log('  Student:    student@demo.com / Student@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
