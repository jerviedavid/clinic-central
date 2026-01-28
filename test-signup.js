import axios from 'axios';

async function testSignup() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/signup', {
            email: 'test' + Math.random() + '@example.com',
            password: 'password123',
            fullName: 'Test User',
            role: 'doctor'
        });
        console.log('Signup successful:', response.data);
    } catch (error) {
        console.error('Signup failed:', error.response ? error.response.data : error.message);
    }
}

testSignup();
