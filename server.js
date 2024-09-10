const express = require('express');
const app = express();
const databaseManager = require('./databaseManager');
const db = new databaseManager();

app.use(express.json());

app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
    console.log('GET /');
    res.render('index');
});


app.post('/shorten', async (req, res) => {

    let fullUrl = req.body.fullUrl;
    if(!fullUrl){
        res.send({
            status: 400,
            message: 'URL is required'
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

app.get('/:shortUrl', async (req, res) => {
    const shortUrl = req.params.shortUrl;
    
    db.getFullUrl(shortUrl, (fullUrl) => {
        if (fullUrl) {
            res.redirect(fullUrl);
        }
        else {
            res.status(404).send('URL not found');
        }
    });
});



app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});