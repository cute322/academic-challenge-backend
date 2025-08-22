// © 2025 Dalila Cherif Slimane — Tous droits réservés. 
// Ce code est propriétaire et confidentiel.
// Voir le fichier LICENSE.md pour plus de détails.
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const app = express();

const db = require('./config/db'); 

const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');

const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

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
