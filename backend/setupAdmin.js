const bcrypt = require('bcryptjs');
const readline = require('readline');
const { pool } = require('./src/config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
    try {
        console.log('\n===========================================');
        console.log('   EXAM PORTAL - Admin Setup Script');
        console.log('===========================================\n');

        // Check if any teachers exist
        const [teachers] = await pool.query('SELECT COUNT(*) as count FROM teachers');

        if (teachers[0].count > 0) {
            console.log('⚠️  Teachers already exist in the database.');
            const proceed = await question('Do you want to create another admin teacher? (yes/no): ');

            if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
                console.log('\n✅ Setup cancelled.');
                rl.close();
                process.exit(0);
            }
        }

        console.log('\n📝 Please provide admin teacher details:\n');

        // Get admin details
        const username = await question('Username: ');
        const email = await question('Email: ');
        const password = await question('Password: ');

        // Validate inputs
        if (!username || !email || !password) {
            console.log('\n❌ Error: All fields are required!');
            rl.close();
            process.exit(1);
        }

        if (password.length < 6) {
            console.log('\n❌ Error: Password must be at least 6 characters long!');
            rl.close();
            process.exit(1);
        }

        // Hash password
        console.log('\n🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert admin teacher
        console.log('💾 Creating admin teacher account...');
        const [result] = await pool.query(
            'INSERT INTO teachers (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        console.log('\n✅ SUCCESS! Admin teacher account created.');
        console.log('\n📋 Account Details:');
        console.log(`   ID: ${result.insertId}`);
        console.log(`   Username: ${username}`);
        console.log(`   Email: ${email}`);
        console.log('\n🔑 You can now login with these credentials.');
        console.log('\n===========================================\n');

        rl.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            console.error('   This email already exists in the database.');
        }

        rl.close();
        process.exit(1);
    }
}

// Run setup
setupAdmin();
