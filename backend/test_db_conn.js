const { Pool } = require('pg');

const passwords = ['postgres', 'postgres_dev_2024', 'password', '123456', 'ssi_wallet', 'root', ''];

async function testPasswords() {
    for (const password of passwords) {
        console.log(`Testing password: "${password}"...`);
        const pool = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: password,
            connectionTimeoutMillis: 2000,
        });

        try {
            const client = await pool.connect();
            console.log(`SUCCESS! Password is: "${password}"`);
            client.release();
            await pool.end();
            process.exit(0);
        } catch (err) {
            console.log(`Failed: ${err.message}`);
        }
        await pool.end();
    }
    console.log('All tested passwords failed.');
    process.exit(1);
}

testPasswords();
