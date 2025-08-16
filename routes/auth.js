// File: academic-challenge-backend/routes/auth.js

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
            { expiresIn: '1h' }, // الرمز المميز صالح لمدة ساعة واحدة
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
    const { email, password } = req.body;

    try {
        // 1. التحقق من وجود المستخدم
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // احصل على كائن المستخدم كاملاً
        const user = result.rows[0];

        // 2. مقارنة كلمة المرور المشفرة
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. إنشاء رمز JWT
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(
            payload,
            jwtSecret, // تأكد من أن jwtSecret معرف لديك
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;

                // ===== START: التعديل المهم هنا =====
                
                // قبل إرسال كائن المستخدم، احذف كلمة المرور منه
                delete user.password;

                // أرسل الكائن "user" كاملاً
                res.json({ 
                    message: 'Logged in successfully',
                    user: user, // <-- أرسل "user" كاملاً وليس كائن جديد
                    token 
                });

                // ===== END: التعديل المهم هنا =====
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
