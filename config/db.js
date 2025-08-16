// File: academic-challenge-backend/config/db.js

const { Pool } = require('pg');
require('dotenv').config(); // تأكد من تحميل متغيرات البيئة هنا

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // ضروري للاتصال بـ Render.com
    }
});

// اختبار الاتصال بقاعدة البيانات عند بدء تشغيل التطبيق
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error acquiring client from DB pool:', err.stack);
        // يمكنك هنا اختيار إنهاء العملية إذا كان الاتصال بقاعدة البيانات حرجًا
        // process.exit(1); 
        return;
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); // تحرير العميل ليعود إلى الـ pool
        if (err) {
            console.error('❌ Error executing initial DB query:', err.stack);
            return;
        }
        console.log('✅ Database connection established successfully!');
        console.log('Current database time:', result.rows[0].now);
    });
});

// تصدير كائن الـ pool ليتم استخدامه في أجزاء أخرى من التطبيق
module.exports = pool;
