const sqlite = require('sqlite3').verbose();
const nanoid = require('nanoid');


class DatabaseManager {
    constructor() {
        this.db = new sqlite.Database('./db/urlShortener.db', (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to the urls database.');
        });
        this.db.run('CREATE TABLE IF NOT EXISTS urls(fullUrl TEXT PRIMARY KEY, shortUrl TEXT, clicks INTEGER DEFAULT 0)');
    }



    getShortUrl(fullUrl) {
        this.db.get('SELECT shortUrl FROM urls WHERE fullUrl = ?', [fullUrl], (err, row) => {
            if (err || !row) {
                return undefined;
            } else {
                return row.shortUrl;
            }
        });
    }


    getFullUrl(shortUrl, callback) {
        this.db.get('SELECT fullUrl FROM urls WHERE shortUrl = ?', [shortUrl], (err, row) => {
            if (err || !row) {
                callback(undefined);
            } else {
                callback(row.fullUrl);
            }
        });
    }



    addUrl(fullUrl, callback) {
        let searchShort = this.getShortUrl(fullUrl);
        if (searchShort) {
            callback(searchShort);
        } else {
            let shortUrl = nanoid.nanoid(12);

            this.db.run('INSERT INTO urls(fullUrl, shortUrl) VALUES(?, ?)', [fullUrl, shortUrl], (err) => {
                if (err) {
                    console.error(err.message);
                    callback(err);
                } else {
                    console.log('Added new URL to database');
                    callback(shortUrl);
                }
            });
        }
    }
    

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


    
}


module.exports = DatabaseManager;


