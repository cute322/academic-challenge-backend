// © 2025 Dalila Cherif Slimane — Tous droits réservés.
// Ce code est propriétaire et confidentiel.
// Voir le fichier LICENSE.md pour plus de détails.

const db = require('../config/db');
const adminMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        next();
    } catch (error) {
        res.status(500).send('Server Error');
    }
};
module.exports = adminMiddleware;