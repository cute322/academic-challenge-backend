// File: academic-challenge-backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config(); // تأكد من تحميل متغيرات البيئة هنا

const jwtSecret = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
    // الحصول على الرمز المميز من رأس الطلب
    const token = req.header('x-auth-token');

    // التحقق مما إذا كان الرمز المميز غير موجود
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // التحقق من الرمز المميز
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user; // إضافة معلومات المستخدم إلى كائن الطلب
        next(); // الانتقال إلى البرمجية الوسيطة أو المسار التالي
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
