const express = require('express');
const app = express();
const databaseManager = require('./databaseManager');
const validUrl = require('valid-url');
const db = new databaseManager("./db/urlShortener.db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const saltRounds = 10;

setInterval(() => {
    console.log('Cleaning up expired URLs');
    db.cleanDates();
}, 7 * 60 * 60 * 1000); // Run every 24 hours



// Function to validate email address
function validEmail(email) {
    // Use a regular expression to validate the email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}



function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = undefined;
    }
    else {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
            if (err) {
                req.user = undefined;
            } else {
                req.user = user;
            }
        });
    }
    next();

}


app.use(express.json());

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    res.render('index');
});

// sign in route to create a new user and generate an API key to access more API features
app.post("/auth/signIn", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // First validate the username and password
    if (!username || !password) {
        return res.send({
            status: 400,
            message: 'Username and password are required'
        });

    }

    if (!validEmail(username)) {
        return res.send({
            status: 400,
            message: 'Invalid email address'
        });
        
    }

    if(!db.searchUser(username)){
        return res.send({
            status: 400,
            message: 'Username already exists'
        });
        
    }
    // Encrypt the password and add the user to the database
    bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
            return res.send({
                status: 500,
                message: 'Failed to encrypt password'
            });

        }
        db.addUser(username, hash, (success) => {
            if (success) {
                // Generate a JWT token to send back to the user. This will be the api key of that user
                jwt.sign({ username: username }, process.env.JWT_SECRET_KEY, (err, token) => {
                    if (err) {
                        console.error(err);
                        res.send({
                            status: 500,
                            message: 'Failed to generate token'
                        });
                    } else {
                        res.send({
                            status: 200,
                            apiKey: token
                        });
                    }
                });

            } else {
                res.send({
                    status: 500,
                    message: 'Failed to create new user'
                });
            }
        });
    });
});



app.get('/getUsername', authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.send({
            status: 401,
            message: 'Unauthorized'
        });
    }
    res.send({
        status: 200,
        username: req.user.username
    });
});


// Determine if the URL is valid and add it to the database generating a short URL
app.post('/shorten', authenticateToken, async (req, res) => {
    var params = req.body;
    let fullUrl = req.body.fullUrl;
    const username = req.user ? req.user.username : null;
    if(!fullUrl){
        return res.send({
            status: 400,
            message: 'URL is required'
        });

    }
    fullUrl = fullUrl.replace("www.", "");

    if(!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')){
        fullUrl = 'https://' + fullUrl;
    }
    
    if (!validUrl.isWebUri(fullUrl)) {
        return res.send({
            status: 400,
            message: 'Invalid URL'
        });
    }

    params.fullUrl = fullUrl;
    

    db.addUrl(params, username, (shortUrl) => {
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