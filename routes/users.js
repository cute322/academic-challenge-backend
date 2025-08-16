// File: academic-challenge-backend/routes/users.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/users
// @desc    جلب جميع المستخدمين (لأغراض إدارية)
// @access  خاص (يتطلب رمز JWT)
router.get('/', auth, async (req, res) => {
    try {
        // تم تحسين الاستعلام لجلب كل البيانات غير الحساسة
        const allUsers = await db.query(
            'SELECT id, username, email, role, academic_points, level, created_at, unlocked_modules FROM users'
        );
        res.json(allUsers.rows);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).send('Server error');
    }
});


// @route   PUT /api/users/progress
// @desc    تحديث التقدم الأكاديمي للمستخدم الحالي
// @access  خاص (المستخدم المسجل دخوله فقط يمكنه تحديث بياناته)
router.put('/progress', auth, async (req, res) => {
    // 1. جلب بيانات التقدم الجديدة من جسم الطلب
    const { academic_points, level, unlocked_modules } = req.body;
    
    // 2. جلب هوية المستخدم بشكل آمن من الـ token
    const userId = req.user.id;

    // 3. التحقق من وجود كل البيانات المطلوبة
    if (academic_points === undefined || level === undefined || unlocked_modules === undefined) {
        return res.status(400).json({ message: 'الرجاء إرسال كل بيانات التقدم المطلوبة.' });
    }

    try {
        // 4. تنفيذ أمر التحديث في قاعدة البيانات
        const updatedUser = await db.query(
            `UPDATE users 
             SET academic_points = $1, level = $2, unlocked_modules = $3 
             WHERE id = $4 
             RETURNING id, username, email, role, academic_points, level, unlocked_modules`,
            [academic_points, level, JSON.stringify(unlocked_modules), userId]
        );

        // 5. التأكد من أن المستخدم قد تم إيجاده وتحديثه
        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        // 6. إرسال استجابة ناجحة مع بيانات المستخدم المحدثة
        res.json({ message: 'تم تحديث التقدم بنجاح', user: updatedUser.rows[0] });

    } catch (error) {
        console.error('Error updating user progress:', error.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/users/me
// @desc    حذف حساب المستخدم الحالي
// @access  خاص (المستخدم المسجل دخوله فقط يمكنه حذف حسابه)
router.delete('/me', auth, async (req, res) => {
    // جلب هوية المستخدم بشكل آمن من الـ token
    const userId = req.user.id;

    try {
        const deletedUser = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        
        if (deletedUser.rows.length === 0) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        res.json({ message: 'تم حذف حساب المستخدم بنجاح', id: deletedUser.rows[0].id });

    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).send('Server error');
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

// @route   GET /api/users/stats/registrations
router.get('/stats/registrations', auth, adminMiddleware, async (req, res) => { /* ... كود الإحصائيات ... */ });

module.exports = router;
