const sqlite = require('sqlite3').verbose();
const nanoid = require('nanoid');
const fs = require('fs');

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
        this.db.run('CREATE TABLE IF NOT EXISTS urls(fullUrl TEXT PRIMARY KEY, shortUrl TEXT, clicks INTEGER DEFAULT 0, exp DATETIME DEFAULT CURRENT_TIMESTAMP)');
    }


    // Get the short URL from the database using the full URL
    getShortUrl(fullUrl) {
        this.db.get('SELECT shortUrl FROM urls WHERE fullUrl = ?', [fullUrl], (err, row) => {
            if (err || !row) {
                return undefined;
            } else {
                return row.shortUrl;
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



    async addUrl(fullUrl, callback) {
        // Check if URL already exists in database and return short URL if it does
        
        let check = await new Promise((resolve, reject) => {
            this.db.get('SELECT shortUrl FROM urls WHERE fullUrl = ?', [fullUrl], (err, row) => {
                if (!err && row) {
                    console.log('URL already exists in database:', row.shortUrl);
                    callback(row.shortUrl);
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });

        if (check) {
            return;
        }

        // Generate short URL and add to database then return it through callback
        let shortUrl = nanoid.nanoid(12);
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const formattedDate = oneWeekFromNow.toISOString();
        console.log('Generated short URL:', shortUrl);
        this.db.run('INSERT INTO urls(fullUrl, shortUrl, exp) VALUES(?, ?, ?)', [fullUrl, shortUrl, formattedDate], (err) => {
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
        this.db.run('DELETE FROM urls WHERE exp > CURRENT_TIMESTAMP');
    }
}

module.exports = DatabaseManager;


