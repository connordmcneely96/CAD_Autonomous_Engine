import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@cad-engine.dev' },
    update: {},
    create: {
      email: 'test@cad-engine.dev',
      name: 'Test User',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@cad-engine.dev' },
    update: {},
    create: {
      email: 'demo@cad-engine.dev',
      name: 'Demo User',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create sample projects
  const sampleProject1 = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      userId: testUser.id,
      name: 'Sample Bracket Design',
      description: 'A simple L-bracket with mounting holes',
      isPublic: true,
      currentVersion: 1,
      featureTree: {
        features: [
          {
            id: 'feat-1',
            type: 'sketch',
            name: 'Base Sketch',
            plane: 'XY',
            operations: [
              { type: 'rectangle', width: 100, height: 50, center: [0, 0] },
            ],
          },
          {
            id: 'feat-2',
            type: 'extrude',
            name: 'Base Extrude',
            sketchId: 'feat-1',
            distance: 10,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample project:', sampleProject1.name);

  const sampleProject2 = await prisma.project.upsert({
    where: { id: 'sample-project-2' },
    update: {},
    create: {
      id: 'sample-project-2',
      userId: demoUser.id,
      name: 'Mechanical Gear',
      description: 'Parametric gear design with customizable teeth',
      isPublic: true,
      currentVersion: 1,
      featureTree: {
        parameters: {
          teeth: 20,
          module: 2.5,
          pressureAngle: 20,
        },
        features: [
          {
            id: 'feat-1',
            type: 'sketch',
            name: 'Gear Profile',
            plane: 'XY',
          },
          {
            id: 'feat-2',
            type: 'extrude',
            name: 'Gear Body',
            distance: 15,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample project:', sampleProject2.name);

  // Create initial version for project 1
  const version1 = await prisma.version.create({
    data: {
      projectId: sampleProject1.id,
      versionNumber: 1,
      message: 'Initial design',
      createdBy: testUser.id,
      featureTree: sampleProject1.featureTree,
    },
  });

  console.log('✅ Created version:', version1.versionNumber, 'for project:', sampleProject1.name);

  // Create initial version for project 2
  const version2 = await prisma.version.create({
    data: {
      projectId: sampleProject2.id,
      versionNumber: 1,
      message: 'Initial parametric design',
      createdBy: demoUser.id,
      featureTree: sampleProject2.featureTree,
    },
  });

  console.log('✅ Created version:', version2.versionNumber, 'for project:', sampleProject2.name);

  // Share project 1 with demo user
  const projectShare = await prisma.projectShare.create({
    data: {
      projectId: sampleProject1.id,
      userId: demoUser.id,
      role: 'EDITOR',
    },
  });

  console.log('✅ Shared project with demo user as EDITOR');

  // Create sample comment
  const comment = await prisma.comment.create({
    data: {
      projectId: sampleProject1.id,
      userId: demoUser.id,
      featureId: 'feat-1',
      text: 'Great design! Consider adding fillets to the corners.',
      resolved: false,
    },
  });

  console.log('✅ Created sample comment');

  // Create sample FEA job
  const feaJob = await prisma.fEAJob.create({
    data: {
      projectId: sampleProject1.id,
      userId: testUser.id,
      status: 'COMPLETED',
      config: {
        analysisType: 'static',
        material: 'steel',
        forces: [
          {
            face: 'top',
            magnitude: 1000,
            direction: [0, 0, -1],
          },
        ],
        constraints: [
          {
            face: 'bottom',
            type: 'fixed',
          },
        ],
        meshSize: 5,
      },
      results: {
        maxStress: 45.2,
        maxDisplacement: 0.023,
        safetyFactor: 5.5,
        convergence: true,
      },
      completedAt: new Date(),
    },
  });

  console.log('✅ Created sample FEA job');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - Users:', 2);
  console.log('  - Projects:', 2);
  console.log('  - Versions:', 2);
  console.log('  - Project Shares:', 1);
  console.log('  - Comments:', 1);
  console.log('  - FEA Jobs:', 1);
  console.log('');
  console.log('🔑 Test Credentials:');
  console.log('  - test@cad-engine.dev');
  console.log('  - demo@cad-engine.dev');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
