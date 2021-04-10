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


//Test Connection
//client.query('DROP TABLE IF EXISTS "Users"', (err, res) => {
//  if (err) {
//    console.log(err.stack);
//  } else {
//    console.log(res.rows[0]);
//  }
//});

client.query('CREATE TABLE IF NOT EXISTS "Users" ("userid" INTEGER, "balance" INTEGER)', (err, res) => {
  if (err) {
    console.log(err.stack);
  } else {
    console.log(res.rows[0]);
  }
});

client.query('INSERT INTO "Users"(userid, balance) VALUES (0001, 10000)', (err, res) => {
  if (err) {
    console.log(err.stack);
  } else {
    console.log(res.rows[0]);
  }
});


var selectResult = "TESTING";

client.query('SELECT * FROM "Users"', (err, res) => {
  if (err) {
    console.log(err.stack);
  } else {
    console.log(res.rows[0]);
    selectResult = res.rows[0];
     console.log("PRINTING SELECT RESULT INSIDE FUNC " + selectResult);
  }
});

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
