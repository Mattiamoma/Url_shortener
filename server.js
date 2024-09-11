const express = require('express');
const app = express();
const databaseManager = require('./databaseManager');
const validUrl = require('valid-url');
const db = new databaseManager("./db/urlShortener.db");


setInterval(() => {
    console.log('Cleaning up expired URLs');
    db.cleanDates();
}, 1000 * 60 * 60);


app.use(express.json());

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    res.render('index');
});

// Determine if the URL is valid and add it to the database generating a short URL
app.post('/shorten', async (req, res) => {
    let fullUrl = req.body.fullUrl;
    if(!fullUrl){
        res.send({
            status: 400,
            message: 'URL is required'
        });
        return;
    }
    fullUrl = fullUrl.replace("www.", "");

    if(!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')){
        fullUrl = 'https://' + fullUrl;
    }
    
    if (!validUrl.isWebUri(fullUrl)) {
        res.send({
            status: 400,
            message: 'Invalid URL'
        });
        return;
    }


    db.addUrl(fullUrl, (shortUrl) => {
        if (shortUrl) {
            shortUrl = `${req.protocol}://${req.get('host')}/${shortUrl}`;
            res.send({
                status: 200,
                shortUrl: shortUrl
            });
        } else {
            res.send({
                status: 500,
                message: 'Failed to shorten URL, please try again'
            });
        }
    });
});

// Redirect to the full URL when the short URL is visited
app.get('/:shortUrl', async (req, res) => {
    const shortUrl = req.params.shortUrl;
    
    db.getFullUrl(shortUrl, (fullUrl) => {
        if (fullUrl) {
            res.redirect(fullUrl);
            db.incrementClicks(shortUrl, (success) => {
                if (success) {
                    console.log('Successfully incremented clicks for short URL:', shortUrl);
                } else {
                    console.error('Failed to increment clicks for short URL:', shortUrl);
                }
            });
        }
        else {
            res.status(404).send('URL not found');
        }
    });
});

// Handle 404 errors for all other routes
app.get("*", (req, res) => { 
    res.status(404).send('Route not found');
});


app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});