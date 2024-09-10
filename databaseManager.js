const sqlite = require('sqlite3').verbose();


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


    
}


module.exports = DatabaseManager;


