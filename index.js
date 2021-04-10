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
const { Sequelize } = require('sequelize');
const port = process.env.PORT || 5000;

//Postgress connection
const sequelize = new Sequelize('postgres://fqlvkimjhnizkt:6cf9bfb4cf165201f6a3fea5e2d2529a3454af2a51dca35d97914efbc05fff5f@ec2-34-198-31-223.compute-1.amazonaws.com:5432/da9r9idh01ouos')
//const sequelize = new Sequelize('da9r9idh01ouos', 'fqlvkimjhnizkt', '6cf9bfb4cf165201f6a3fea5e2d2529a3454af2a51dca35d97914efbc05fff5f', {
//  host: 'ec2-34-198-31-223.compute-1.amazonaws.com',
//  dialect: 'postgres'
//});

async function testCon(){
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testCon();

var DataTypes = require('sequelize/lib/data-types');

//Schema Definition
const User = sequelize.define('User', {
  // Model attributes are defined here
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  holdings: {
    type: DataTypes.STRING,
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    allowNull: false
  }
}, {
  // Other model options go here
});

// `sequelize.define` also returns the model
console.log(User === sequelize.models.User); // true

async function createIfNotExists(){
   try{
      await User.sync();  
   } catch (error) {
      console.error('Error creating database:', error);
   }
}

async function syncDatabase(){
   try{
      await User.sync({ alter: true});  
   } catch (error) {
      console.error('Error syncing database:', error);
   }
}

createIfNotExists();
syncDatabase();

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

app.get('/finnhub/quote', (req, res) => {
    finnhubClient.quote(req.query.symbol, (error, data, response) => {
        res.send(data)
    })
});

app.listen(port, () => 
    console.log(`Express running on port ${port}`));
