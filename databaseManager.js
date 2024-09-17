const sqlite = require('sqlite3').verbose();
const nanoid = require('nanoid');
const fs = require('fs');
const defaultExp = 7 //days
class DatabaseManager {
    constructor(dbPath) {
        // Create database if path does not exist
        if(!fs.existsSync(dbPath)) {
            console.log('Database does not exist, creating...');
            let path = dbPath.split('/');
            path.pop();
            path = path.join('/');
            fs.mkdirSync(path, { recursive: true });
        }

        this.db = new sqlite.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                process.exit(1);
            }
            console.log('Connected to the urls database.');
        });

        this.db.run(`
            CREATE TABLE IF NOT EXISTS users(
                username TEXT PRIMARY KEY, 
                password TEXT NOT NULL
            )`
        );

        this.db.run(`
            CREATE TABLE IF NOT EXISTS urls(
                fullUrl TEXT,
                shortUrl TEXT PRIMARY KEY,
                clicks INTEGER DEFAULT 0,
                exp INTEGER DEFAULT 0,
                username TEXT REFERENCES users(username) ON DELETE CASCADE DEFAULT NULL
            )
        `);
    }


    addUser(username, password, callback) {
        this.db.run('INSERT INTO users(username, password) VALUES(?, ?)', [username, password], (err) => {
            if (err) {
                console.error(err.message);
                callback(false);
            } else {
                console.log('Added new user to database');
                callback(true);
            }
        });
    }


    searchUser(username) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err || !row) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }



    // Get the short URL from the database using the full URL
    getShortUrl(fullUrl, user) {
        return new Promise((resolve, reject) => {
            if (!user) {
                this.db.get('SELECT shortUrl FROM urls WHERE fullUrl = ? AND username IS NULL', [fullUrl], (err, row) => {
                    if (err || !row) {
                        resolve(undefined);
                    } else {
                        resolve(row.shortUrl);
                    }
                });
            } else {
                this.db.get('SELECT shortUrl FROM urls WHERE fullUrl = ? AND username = ?', [fullUrl, user], (err, row) => {
                    if (err || !row) {
                        resolve(undefined);
                    } else {
                        resolve(row.shortUrl);
                    }
                });
            }
        });
    }

    // Get the full URL from the database using the short URL
    getFullUrl(shortUrl, callback) {
        this.db.get('SELECT fullUrl FROM urls WHERE shortUrl = ?', [shortUrl], (err, row) => {
            if (err || !row) {
                callback(undefined);
            } else {
                callback(row.fullUrl);
            }
        });
    }

    

    async addUrl(params, user, callback) {
        // Check if URL already exists in database and return short URL if it does
        let fullUrl = params.fullUrl;
        let check = await this.getShortUrl(fullUrl, user);

        if (check) {
            callback(check);
            return;
        }
        let date = new Date();
        var formattedDate = date.setDate(date.getDate() + defaultExp);
        var shortUrl = nanoid.nanoid(12);

        if(user) {
            //insert custom parameters for logged users
            if(params.exp) {
                formattedDate = date.setDate(date.getDate() + params.exp);
            }
            if(params.customDir) {
                //check if there is already custom URL in db as shortUrl
                this.getFullUrl(params.customUrl, (fullUrl) => {
                    if (!fullUrl) {
                        
                        shortUrl = params.customDir;
                        return;
                    }
                });

            }

        }
        console.log('Generated short URL:', shortUrl);
        this.db.run('INSERT INTO urls(fullUrl, shortUrl, exp, username) VALUES(?, ?, ?, ?)', [fullUrl, shortUrl, formattedDate, user], (err) => {
            if (err) {
                console.error(err.message);
                callback(undefined);
            } 
            else {
                console.log('Added new URL to database');
                callback(shortUrl);
            }
        });
    }
    
    // Increment the number of clicks for a short URL to track usage
    incrementClicks(shortUrl, callback) {
        this.db.run('UPDATE urls SET clicks = clicks + 1 WHERE shortUrl = ?', [shortUrl], (err) => {
            if (err) {
                console.error(err.message);
                callback(err);
            } else {
                console.log('Incremented clicks for short URL:', shortUrl);
                callback(true);
            }
        });
    }



    cleanDates() {
        let now = Date.now();
        this.db.get('DELETE FROM urls WHERE exp < ?', [now], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
}

module.exports = DatabaseManager;


