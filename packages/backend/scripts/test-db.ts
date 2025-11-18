import { db } from '../src/services/database.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health check...');
    const isHealthy = await db.healthCheck();
    console.log(isHealthy ? '✅ Database is healthy' : '❌ Database health check failed');

    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    // Test 2: Get metrics
    console.log('\n2️⃣  Fetching database metrics...');
    const metrics = await db.getMetrics();
    console.log('✅ Database metrics:');
    console.log(`   - Users: ${metrics.users}`);
    console.log(`   - Projects: ${metrics.projects}`);
    console.log(`   - Versions: ${metrics.versions}`);
    console.log(`   - Comments: ${metrics.comments}`);
    console.log(`   - FEA Jobs: ${metrics.feaJobs}`);

    // Test 3: Query users
    console.log('\n3️⃣  Testing user queries...');
    const users = await db.getClient().user.findMany({ take: 5 });
    console.log(`✅ Found ${users.length} users`);
    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.name || 'No name'})`);
    });

    // Test 4: Query projects
    console.log('\n4️⃣  Testing project queries...');
    const projects = await db.getClient().project.findMany({ take: 5 });
    console.log(`✅ Found ${projects.length} projects`);
    projects.forEach((project) => {
      console.log(`   - ${project.name} (${project.isPublic ? 'Public' : 'Private'})`);
    });

    // Test 5: Test relationships
    console.log('\n5️⃣  Testing relationships...');
    const firstProject = projects[0];
    if (firstProject) {
      const projectWithRelations = await db.findProjectById(firstProject.id);
      if (projectWithRelations) {
        console.log(`✅ Project with relations: ${projectWithRelations.name}`);
        console.log(`   - Owner: ${projectWithRelations.user.email}`);
        console.log(`   - Versions: ${projectWithRelations.versions.length}`);
        console.log(`   - Comments: ${projectWithRelations.comments.length}`);
        console.log(`   - Shares: ${projectWithRelations.projectShares.length}`);
      }
    }

    // Test 6: Test public projects
    console.log('\n6️⃣  Testing public projects query...');
    const publicProjects = await db.findPublicProjects(5);
    console.log(`✅ Found ${publicProjects.length} public projects`);

    // Test 7: Test FEA jobs
    console.log('\n7️⃣  Testing FEA job queries...');
    const pendingJobs = await db.findPendingFEAJobs();
    console.log(`✅ Found ${pendingJobs.length} pending FEA jobs`);

    console.log('\n🎉 All database tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   Total records: ${Object.values(metrics).reduce((a, b) => a + b, 0)}`);
    console.log('   Connection: OK');
    console.log('   Queries: OK');
    console.log('   Relationships: OK\n');
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
    console.log('👋 Disconnected from database');
  }
}

// Run tests
testDatabaseConnection();
