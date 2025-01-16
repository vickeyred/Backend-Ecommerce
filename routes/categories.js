const express = require('express');
const createDbConnection = require('../config/database');
const authenticateToken = require('../middleware/auth'); 
const router = express.Router();

// Get All Categories with Pagination
router.get('/', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const offset = (page - 1) * pageSize;

    try {
        const db = await createDbConnection();

        // Log query parameters for debugging
        console.log('Query Parameters:', { page, pageSize, offset });

        db.all(
            'SELECT * FROM categories LIMIT CAST(? AS INTEGER) OFFSET CAST(? AS INTEGER)', 
            [pageSize, offset],
            (err, rows) => {
                if (err) {
                    console.error('Database Query Error:', err);
                    return res.status(500).json({ error: 'Internal server error while fetching categories.' });
                }

                db.get('SELECT COUNT(*) AS total FROM categories', (err, countRow) => {
                    if (err) {
                        console.error('Database Count Query Error:', err);
                        return res.status(500).json({ error: 'Failed to retrieve categories count.' });
                    }

                    const total = countRow.total;
                    const totalPages = Math.ceil(total / pageSize);

                    // Send response
                    res.json({
                        success: true,
                        categories: rows,
                        pagination: {
                            page,
                            pageSize,
                            total,
                            totalPages,
                        },
                    });
                });
            }
        );
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
