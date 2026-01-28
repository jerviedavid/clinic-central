import bcrypt from 'bcryptjs';

async function testBcrypt() {
    try {
        const start = Date.now();
        const hash = await bcrypt.hash('password123', 10);
        console.log('Hash successful:', hash);
        console.log('Time taken:', Date.now() - start, 'ms');
    } catch (error) {
        console.error('Bcrypt failed:', error);
    }
}

testBcrypt();
