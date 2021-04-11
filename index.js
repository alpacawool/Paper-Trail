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
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;

//Postgres connestion
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://fqlvkimjhnizkt:6cf9bfb4cf165201f6a3fea5e2d2529a3454af2a51dca35d97914efbc05fff5f@ec2-34-198-31-223.compute-1.amazonaws.com:5432/da9r9idh01ouos',
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

    client.query('CREATE TABLE IF NOT EXISTS "Users" ("username" VARCHAR, "password" VARCHAR, "holdings" VARCHAR, "balance" INTEGER)', (err, res) => {
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


//dropTable();
createTable();


async function selectFrom(data, table, condition) {

    console.log(`SELECT ${data} FROM ${table} ${condition}`);

  try {
    const res = await client.query(
      `SELECT ${data} FROM ${table} ${condition}`
    );
    return res.rows;
  } catch (err) {
    return err.stack;
  }
}


async function isCorrectPassword (uname, triedPwd){

    var result = await selectFrom('*', '\"Users\"', 'WHERE username = \'' + uname + '\'');
    if (result[0].password == triedPwd){
        console.log("CORRECT");
        return true;
    } else {
        console.log("INCORRECT");
        console.log(result[0].password);
        return false;
    }

}


//displayAll();

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


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

// Loads login.hbs inside index.hbs
app.get('/', (req, res) => {
    res.status(200).render('login', {layout: 'index'})
});

app.post('/authenticate', async (req, res) => {
    var usernameProvided = req.body.username;
    var passwordProvided = req.body.password;

    const auth = await isCorrectPassword(usernameProvided, passwordProvided);

    if (auth == true){
        console.log("Login Success");
        res.redirect("/home/:" + req.body.username);
    } else {
        console.log("Logain Failed");
        res.send("Login fail");
    }

});

// Page after logging in
app.get('/home/:username', async (req, res) => {
    var leaderboardData = await selectFrom('*', '\"Users\"', '');
    console.log(leaderboardData);
    res.status(200).render('home');//, leaderboardData);
});

app.post('/insertRecord', (req, res) => {
    console.log(req.body.username);
    console.log(req.body.password);
    insertRow(req.body.username, req.body.password, null, 10000);
    displayAll();

    res.redirect("/home/:" + req.body.username);
});

app.get('/leaderboard', (req, res) => {

    client.query('SELECT username, balance FROM "Users" ORDER BY balance DESC', (err, response) => {
        if (err) {
            console.log(err.stack);
        } else {
            res.send(response.rows);
        }
    });
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
