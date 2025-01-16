const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const db = new sqlite3.Database('/home/dell/E-commerce/E_commerce.db');

db.all('SELECT * FROM products', [], async (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }

    const solrDocuments = rows.map((row) => ({
        P_id: row.productId,
        productName: row.productName,
        C_id: row.categoryId,
        numberOfUnits: parseInt(row.numberOfUnits),
        mrp: row.mrp,
        discountPrice: row.discountPrice
    }));

    try {
        const response = await axios.post(
            'http://localhost:8983/solr/products/update/json/docs?commit=true',
            solrDocuments,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );
        console.log('Data indexed successfully:', response.data);
    } catch (error) {
        console.error('Error indexing data:', error.message);
    }
});