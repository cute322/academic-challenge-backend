// © 2025 Dalila Cherif Slimane — Tous droits réservés.
// Ce code est propriétaire et confidentiel.
// Voir le fichier LICENSE.md pour plus de détails.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // لتشفير كلمات المرور
const jwt = require('jsonwebtoken'); // لإنشاء رموز JWT
const db = require('../config/db'); // استيراد كائن الـ Pool
const auth = require('../middleware/authMiddleware');

// سر JWT (يجب أن يكون في متغيرات البيئة)
const jwtSecret = process.env.JWT_SECRET;

// @route   POST /api/auth/register
// @desc    تسجيل مستخدم جديد
// @access  عام
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. التحقق مما إذا كان المستخدم موجودًا بالفعل
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // 2. تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. حفظ المستخدم في قاعدة البيانات
        const newUser = await db.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        // 4. إنشاء رمز JWT
        const payload = {
            user: {
                id: newUser.rows[0].id
            }
        };
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '30d' }, // الرمز المميز صالح لمدة 30 يوماً عند التسجيل الجديد
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ 
                    message: 'User registered successfully',
                    user: newUser.rows[0],
                    token 
                });
            }
        );

    } catch (error) {
        console.error('Error during registration:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    تسجيل دخول المستخدم
// @access  عام
router.post('/login', async (req, res) => {    
    // === التعديل الأول: استقبال قيمة "rememberMe" ===
    const { email, password, rememberMe } = req.body; 

    try {
        // 1. التحقق من وجود المستخدم
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // 2. مقارنة كلمة المرور المشفرة
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. إنشاء رمز JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role // أضفت الصلاحية هنا لتكون متاحة في الواجهة الأمامية إذا احتجت إليها
            }
        };

        // === التعديل الثاني: تحديد مدة الصلاحية بناءً على اختيار المستخدم ===
        const expiresIn = rememberMe ? '30d' : '3h'; // 30 يوماً إذا تم تذكره، 3 ساعات إذا لم يتم

        jwt.sign(
            payload,
            jwtSecret,
            // === التعديل الثالث: استخدام مدة الصلاحية الجديدة هنا ===
            { expiresIn: expiresIn }, 
            (err, token) => {
                if (err) throw err;
                
                // احذف كلمة المرور قبل إرسال بيانات المستخدم
                delete user.password;

                // أرسل كائن "user" كاملاً مع بقية البيانات المفيدة
                res.json({ 
                    message: 'Logged in successfully',
                    user: user,
                    token 
                });
            }
        );

    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send('Server error');
    }
});


// @route   GET /api/auth/me
// @desc    Get logged in user data from token
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        // middleware الـ "auth" قام بفك التوكن ووضع id المستخدم في req.user
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        delete user.rows[0].password; // لا ترسل كلمة المرور أبداً
        res.json(user.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/leaderboard
// @desc    Get top 10 users by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.query(
            'SELECT username, level, academic_points FROM users ORDER BY academic_points DESC, level DESC LIMIT 10'
        );
        res.json(leaderboard.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;