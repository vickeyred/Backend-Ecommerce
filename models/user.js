const createDbConnection = require('../config/database');
const bcrypt = require('bcrypt');

const User = {
    create: async (username, password) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const db = await createDbConnection(); 

        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (username, password) VALUES (?, ?)`,
                [username, hashedPassword],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID); // Return the new user's ID
                    }
                }
            );
        });
    },

    findByUsername: async (username) => {
        const db = await createDbConnection(); 

        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM users WHERE username = ?`,
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row); // Return the user record
                    }
                }
            );
        });
    },
};

module.exports = User;
