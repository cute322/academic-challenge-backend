// File: academic-challenge-backend/server.js (أو app.js / index.js)

// 1. تحميل متغيرات البيئة (يجب أن يكون هذا السطر الأول)
require('dotenv').config(); 

// 2. استيراد المكتبات الأساسية
const express = require('express');
const cors = require('cors');
const app = express();

// 3. استيراد كائن الـ Pool من ملف إعداد قاعدة البيانات
// هذا الاستيراد سيقوم تلقائيًا بتشغيل كود الاتصال في db.js عند بدء تشغيل الخادم
const db = require('./config/db'); 

// 4. استيراد المسارات (Routes)
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');

// 5. تعريف المنفذ
const PORT = process.env.PORT || 5000;

// 6. Middleware (البرمجيات الوسيطة)
app.use(cors()); // للسماح بطلبات من نطاقات مختلفة (مهم للواجهة الأمامية)
app.use(express.json()); // لتحليل طلبات JSON الواردة
// test <-- أضف شيئاً كهذا

// 7. تعريف المسارات (Routes)
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', require('./routes/users'));
// 8. مسار افتراضي (اختياري)
app.get('/', (req, res) => {
    res.send('Academic Challenge Backend API is running!');
});

// 9. مسار اختبار الاتصال بقاعدة البيانات (اختياري، ولكن مفيد)
// هذا المسار يسمح لك باختبار الاتصال من المتصفح أو Postman
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()'); 
        res.status(200).json({ 
            message: 'Database connection successful!',
            currentTime: result.rows[0].now 
        });
    } catch (error) {
        console.error('DB Test Error:', error);
        res.status(500).json({ 
            message: 'Database connection failed', 
            error: error.message 
        });
    }
});


// 10. تشغيل الخادم
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
