import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Connecting to database...');
        // Try to count users to verify connection
        const userCount = await prisma.user.count();
        console.log(`✅ Successfully connected! Found ${userCount} users.`);

        // Create a test user if none exist (optional, just to prove write access)
        if (userCount === 0) {
            console.log('📝 Creating test user...');
            await prisma.user.create({
                data: {
                    email: 'test@example.com',
                    name: 'Test User'
                }
            });
            console.log('✅ Test user created.');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
