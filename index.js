/* Beaverhacks Spring 2021
** Paper Trail
** Team Members: Derth Adams, Kelton Orth, 
**               Yongsung Cho, Patricia Booth
** Instructions: To run locally (node.js required):
    * Navigate to root project directory on terminal
    * Type the following lines:
    *   npm install
    *   node index.js
    * Visit site on http://localhost:5000/
*/

const express = require('express');
const finnhub = require('finnhub');
const port = process.env.PORT || 5000;


//Postgres connestion
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

function dropTable(){

    client.query('DROP TABLE IF EXISTS "Users"', (err, res) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log("Dropped Table");
        }
    });
}

function createTable(){

    client.query('CREATE TABLE IF NOT EXISTS "Users" ("userid" VARCHAR, "password" VARCHAR, "holdings" VARCHAR, "balance" INTEGER)', (err, res) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log("Created Table");
        }
    });
}

function insertRow(username, password, holdings, balance){
    
    var queryString = 'INSERT INTO "Users" VALUES (\'' + username + '\',\'' + password + '\',\'' + holdings + '\',\'' + balance + '\')';
    
    console.log(queryString);

    client.query(queryString, (err, res) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log("Inserted row into table");
        }
    });
}


function displayAll(){
    
    console.log("Displaying table")
    
    var result = client.query('SELECT * FROM "Users"', (err, res) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(res.rows);
        }
    });
    
    return result;
}

dropTable();
createTable();


// Set up Finnhub connection
const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = "c1nkgs237fku88ebnubg";
const finnhubClient = new finnhub.DefaultApi();

// Initialize express and set view engine to handlebars(.hbs)
const app = express();
const handlebars = require('express-handlebars');
app.set('view engine', 'hbs');
app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    defaultLayout: 'index',
    extname: 'hbs'
}));

app.use(express.static('public'));

// Loads login.hbs inside index.hbs
app.get('/', (req, res) => {
    res.status(200).render('login', {layout: 'index'})
});

// Page after logging in
app.get('/home', (req, res) => {
    res.status(200).render('home');
});

app.get('/chart', (req, res) => {
    res.status(200).render('chart');
});


// signup
app.get('/signup', (req, res) => {
    res.status(200).render('signup');
});



// Endpoints for serving Finnhub data to client
app.get('/finnhub/candlestick', (req, res) => {
    finnhubClient.stockCandles(req.query.symbol, req.query.interval, req.query.from, req.query.to, {}, (error, data, response) => {
        res.send(data)
    })
});

app.get('/finnhub/crypto', (req, res) => {
    finnhubClient.cryptoCandles(req.query.symbol, req.query.interval, req.query.from, req.query.to, (error, data, response) => {
        res.send(data)
    })
});

app.get('/finnhub/quote', (req, res) => {
    finnhubClient.quote(req.query.symbol, (error, data, response) => {
        res.send(data)
    })
});

app.listen(port, () => 
    console.log(`Express running on port ${port}`));
