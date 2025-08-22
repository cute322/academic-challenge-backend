// © 2025 Dalila Cherif Slimane — Tous droits réservés.
// Ce code est propriétaire et confidentiel.
// Voir le fichier LICENSE.md pour plus de détails.

const express = require('express');
const router = express.Router();
const db = require('../config/db'); // استيراد كائن الـ Pool
const auth = require('../middleware/authMiddleware'); // استيراد البرمجية الوسيطة للمصادقة

// @route   POST /api/comments
// @desc    إضافة تعليق جديد
// @access  خاص (يتطلب رمز JWT)
router.post('/', auth, async (req, res) => {
    // الخطوة 1: خذ محتوى التعليق فقط من جسم الطلب
    const { content } = req.body;
    
    // الخطوة 2: خذ هوية المستخدم بشكل آمن ومباشر من الـ token (بعد أن عالجه middleware المصادقة)
    const userIdFromToken = req.user.id;

    // التحقق من وجود محتوى للتعليق
    if (!content) {
        return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    try {
        // الخطوة 3: أدخل التعليق في قاعدة البيانات باستخدام هوية المستخدم من الـ token
        const newComment = await db.query(
            'INSERT INTO comments (content, user_id) VALUES ($1, $2) RETURNING *',
            [content, userIdFromToken] // <-- استخدام المتغير الآمن هنا
        );
        res.status(201).json(newComment.rows[0]);
    } catch (error) {
        console.error('Error creating comment:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/comments
// @desc    جلب جميع التعليقات
// @access  عام (يمكن لأي شخص رؤية التعليقات)
router.get('/', async (req, res) => {
    try {
        // يمكنك إضافة JOIN لجلب اسم المستخدم مع التعليق
        const allComments = await db.query(`
            SELECT 
                c.id, 
                c.content, 
                c.created_at, 
                u.username AS author_username, 
                u.id AS author_id
            FROM comments c
            JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `);
        res.json(allComments.rows);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/comments/:id
// @desc    تحديث تعليق بواسطة ID
// @access  خاص (يتطلب رمز JWT، ويجب أن يكون المستخدم هو صاحب التعليق)
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    try {
        // 1. التحقق مما إذا كان التعليق موجودًا ويخص المستخدم المصادق عليه
        const comment = await db.query('SELECT user_id FROM comments WHERE id = $1', [id]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to update this comment' });
        }

        // 2. تحديث التعليق
        const updatedComment = await db.query(
            'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );
        res.json({ message: 'Comment updated successfully', comment: updatedComment.rows[0] });
    } catch (error) {
        console.error('Error updating comment:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/comments/:id
// @desc    حذف تعليق بواسطة ID
// @access  خاص (يتطلب رمز JWT، ويجب أن يكون المستخدم هو صاحب التعليق)
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. التحقق مما إذا كان التعليق موجودًا ويخص المستخدم المصادق عليه
        const comment = await db.query('SELECT user_id FROM comments WHERE id = $1', [id]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        // 2. حذف التعليق
        const deletedComment = await db.query('DELETE FROM comments WHERE id = $1 RETURNING id', [id]);
        res.json({ message: 'Comment deleted successfully', id: deletedComment.rows[0].id });
    } catch (error) {
        console.error('Error deleting comment:', error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
