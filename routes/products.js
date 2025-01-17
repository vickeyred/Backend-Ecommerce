const express = require('express');
const axios = require('axios');
const createDbConnection = require('../config/database');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    const {
        page = 1,
        pageSize = 10,
        search = '',
        minPrice = 0,
        maxPrice = 999999,
        minItems = 0,
        maxItems = 999999,
        minDiscount = 0,
        maxDiscount = 999999,
        useSolr = 'true',
        categoryId = '', 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    if (useSolr === 'true') {
        try {
            const solrBaseUrl = process.env.SOLR_URL || 'http://localhost:8983/solr/products/select';
            let productName = search.trim();
            let dynamicMinPrice = null;
            let dynamicMaxPrice = null;

            const priceConditions = productName.match(/(above|greater than|higher than|below|under|less than)\s*(\d+)/gi);
            if (priceConditions) {
                priceConditions.forEach((condition) => {
                    const match = condition.match(/(above|greater than|higher than|below|under|less than)\s*(\d+)/i);
                    if (match) {
                        const [_, type, value] = match;
                        const priceValue = parseFloat(value);
                        if (['below', 'under', 'less than'].includes(type.toLowerCase())) {
                            dynamicMaxPrice = priceValue;
                        } else if (['above', 'greater than', 'higher than'].includes(type.toLowerCase())) {
                            dynamicMinPrice = priceValue;
                        }
                    }
                });

                priceConditions.forEach(condition => {
                    productName = productName.replace(condition, '').trim();
                });
            }

            const fqFilters = [
                `MRP:[${dynamicMinPrice !== null ? dynamicMinPrice : minPrice} TO ${dynamicMaxPrice !== null ? dynamicMaxPrice : maxPrice}]`,
                `no_of_items:[${minItems} TO ${maxItems}]`,
                `discount_price:[${minDiscount} TO ${maxDiscount}]`,
            ];

            if (categoryId) {
                fqFilters.push(`C_id:${categoryId}`);
            }

            const queryParams = {
                q: productName ? `P_name:${encodeURIComponent(productName)}` : '*:*',
                fq: fqFilters.join(' AND '),
                start: offset,
                rows: pageSize,
                wt: 'json',
                fl: 'P_id,P_name,MRP,discount_price,no_of_items,C_id',
                qf: 'P_name^3 MRP^2 discount_price^2 no_of_items^1',
                pf: 'P_name^5',
            };

            const queryString = new URLSearchParams(queryParams).toString();
            const solrResponse = await axios.get(`${solrBaseUrl}?${queryString}`);
            const products = solrResponse.data.response.docs;

            const db = await createDbConnection();
            const categoryMap = await new Promise((resolve, reject) => {
                db.all('SELECT C_id, C_name FROM categories', (err, rows) => {
                    if (err) return reject(err);
                    const map = {};
                    rows.forEach(row => map[row.C_id] = row.C_name);
                    resolve(map);
                });
            });

            const productsWithCategoryName = products.map(product => ({
                ...product,
                category_name: categoryMap[product.C_id] || 'Unknown',
            }));

            const total = solrResponse.data.response.numFound;
            const totalPages = Math.ceil(total / pageSize);

            res.json({
                products: productsWithCategoryName,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total,
                    totalPages,
                },
            });
        } catch (error) {
            console.error('Solr query error:', error.message);
            res.status(500).json({ error: 'Error executing Solr query', details: error.message });
        }
    } else {
        try {
            const db = await createDbConnection();

            let query = `
                SELECT p.*, c.C_name AS category_name
                FROM products p
                LEFT JOIN categories c ON p.C_id = c.C_id
                WHERE P_name LIKE ?
                    AND MRP BETWEEN ? AND ?
                    AND no_of_items BETWEEN ? AND ?
                    AND discount_price BETWEEN ? AND ?
            `;
            const params = [`%${search}%`, minPrice, maxPrice, minItems, maxItems, minDiscount, maxDiscount];

            if (categoryId) {
                query += ` AND p.C_id = ?`;
                params.push(categoryId);
            }

            query += ' LIMIT ? OFFSET ?';
            params.push(pageSize, offset);

            db.all(query, params, (err, rows) => {
                if (err) {
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const countQuery = `
                    SELECT COUNT(*) AS total
                    FROM products p
                    LEFT JOIN categories c ON p.C_id = c.C_id
                    WHERE P_name LIKE ?
                        AND MRP BETWEEN ? AND ?
                        AND no_of_items BETWEEN ? AND ?
                        AND discount_price BETWEEN ? 
                      ${categoryId ? 'AND p.C_id = ?' : ''}
                `;
                const countParams = [
                    `%${search}%`,
                    minPrice,
                    maxPrice,
                    minItems,
                    maxItems,
                    minDiscount,
                    maxDiscount,
                    ...(categoryId ? [categoryId] : []),
                ];

                db.get(countQuery, countParams, (err, countRow) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to get total products count' });
                    }

                    const total = countRow.total;
                    const totalPages = Math.ceil(total / pageSize);

                    res.json({
                        products: rows,
                        pagination: {
                            page: parseInt(page),
                            pageSize: parseInt(pageSize),
                            total,
                            totalPages,
                        },
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});


router.get('/categories', async (req, res) => {
    try {
        const db = await createDbConnection();
        db.all('SELECT * FROM categories', (err, rows) => {
            if (err) {
                console.error('Error fetching categories:', err.message);
                return res.status(500).json({ error: 'Failed to fetch categories' });
            }
            console.log('Fetched categories:', rows); 
            res.json({ categories: rows });
        });
    } catch (error) {
        console.error('Database connection error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
