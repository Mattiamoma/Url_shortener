const express = require('express');
const app = express();
const databaseManager = require('./databaseManager');
db = new databaseManager();


app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('index');
});


app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});