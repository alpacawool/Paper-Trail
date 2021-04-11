const LAST_500_POINTS = 30000;
const CHART_INTERVAL = "1";
const EDT_OFFSET = 14400;
const MIN_RANDOM_PRICE = 200;
const MAX_RANDOM_PRICE = 500;
const REFRESH_INTERVAL = 2000;

const CHART_WIDTH_PERCENTAGE = 0.9;
const CHART_HEIGHT_PERCENTAGE  = 0.7;

const companies = [
    "BINANCE:DASHUSDT",
    "BINANCE:ZECUSDT",
    "BINANCE:ETHUSDT",
    "BINANCE:YFIIUSDT",
    "BINANCE:MKRUSDT",
    "BINANCE:BNBUPUSDT",
    "BINANCE:BCHUSDT",
    "BINANCE:BNBUSDT",
    "BINANCE:COMPUSDT",
    "BINANCE:KSMUSDT",
    "BINANCE:AAVEUSDT",
    "BINANCE:XMRUSDT",
];

let currentSymbol = companies[0];
let currentCompanyName = "Appie (AAPI)";
let lastTimestamp;
let latestQuotes = {};

function setQuote(price, lastUpdatedTime) {
    return {
        price: price,
        lastUpdated: lastUpdatedTime
    }
}

function initializeQuotes() {
    companies.forEach(company => {
        latestQuotes[company] = setQuote(getRandomFloat(MIN_RANDOM_PRICE, MAX_RANDOM_PRICE),
            UTCtoEDT(getUTCTimestampSeconds()));
    })
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function* cycleSymbols() {
    let index = 0;
    let lastIndex = companies.length - 1;
    while (true) {
        yield companies[index];
        if (index < lastIndex) {
            index++;
        } else {
            index = 0;
        }
    }
}

const symbolGenerator = cycleSymbols();

function getNextPriceQuote() {
    return new Promise((resolve) => {
        let symbol = symbolGenerator.next().value;
        getFinnQuote(symbol)
            .then(data => {
//                 console.log("Status code for " + symbol + " request: " + data.status);
                latestQuotes[symbol] = setQuote(data.body.c, UTCtoEDT(getUTCTimestampSeconds()));
                resolve('resolved');
            })
            .catch(error => console.error(error))
    });
}

function getUTCTimestampSeconds() {
    return Math.floor(Date.now() / 1000);
}

/**
 * @return {number}
 */
function UTCtoEDT(utc) {
    return utc - EDT_OFFSET;
}

function getFinnQuote(symbol) {
    return fetch('/finnhub/quote/?symbol=' + symbol)
        .then(response => response.json()
            .catch(error => console.error(error))
        .then(data => ({
            status: response.status,
            body: data
        })))
}

function getCryptoCandle(symbol, interval, from, to) {
    return fetch('/finnhub/crypto/?symbol=' + symbol + '&interval=' + interval + '&from=' + from + '&to=' + to)
        .then(response => response.json()
            .catch(error => console.error(error))
        .then(data => ({
            status: response.status,
            body: data
        })))
}

function finnCandleToLineData(data) {
    let result = [];
    for (let i = 0; i < data.c.length; i++) {
        result.push({
            "time": UTCtoEDT(data.t[i]),
            "value": data.c[i]
        });
    }
    return result;
}

function loadChartData(chart, series, symbolName, current) {
    let to = getUTCTimestampSeconds();
    let from = to - LAST_500_POINTS;
    getCryptoCandle(currentSymbol, CHART_INTERVAL, from, to)
        .then(data => {
            symbolName.innerText = currentCompanyName;

            let priceData = finnCandleToLineData(data.body);
            series.setData(priceData);

            chart.timeScale().fitContent();
            lastTimestamp = to;

            latestQuotes[currentSymbol] = setQuote(priceData[priceData.length - 1].value, to);

            updateCurrentQuoteHeading(current, priceData[priceData.length - 1].value);
        })
        .catch(error => console.error(error));
}

function updateCurrentQuoteHeading(current, price) {
    current.innerText = price.toFixed(2);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeQuotes();
    const chartBody = document.getElementById('chart');
    const graphContainer = document.getElementById('graphContainer');
    const symbolName = document.getElementById('symbol-name');
    // const symbolSelectForm = document.getElementById('symbol-select');
    // const symbolSelect1 = document.getElementById('symbol-select1');
    // const symbolSelect2 = document.getElementById('symbol-select2');
    // const symbolSelect3 = document.getElementById('symbol-select3');
    // const symbolSelect4 = document.getElementById('symbol-select4');
    // const symbolSelect5 = document.getElementById('symbol-select5');
    // const symbolSelect6 = document.getElementById('symbol-select6');
    // const symbolSelect7 = document.getElementById('symbol-select7');
    // const symbolSelect8 = document.getElementById('symbol-select8');
    // const symbolSelect9 = document.getElementById('symbol-select9');
    const symbolSelectors = document.querySelectorAll('.symbol-select')

    const current = document.getElementById('price-current');

    const priceChart = LightweightCharts.createChart(chartBody, {
        timeScale: {
            timeVisible: true
        },
        grid: {
            vertLines: {
                visible: false
            }
        }
    });
    const areaSeries = priceChart.addAreaSeries({lineWidth: 1});
    resizeChart();
    function resizeChart() {
        priceChart.applyOptions({
            width: Math.floor(graphContainer.offsetWidth * CHART_WIDTH_PERCENTAGE),
            height: Math.floor(graphContainer.offsetHeight * CHART_HEIGHT_PERCENTAGE)
        });
    }

    loadChartData(priceChart, areaSeries, symbolName, current);

    window.onresize = resizeChart;

    symbolSelectors.forEach(item => {
        item.addEventListener('submit', (event) => {
            event.preventDefault();
            currentSymbol = event.target[0].value;
            currentCompanyName = event.target[0].name;
            loadChartData(priceChart, areaSeries, symbolName, current)
        })
    });

    // symbolSelectForm.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     // symbol = 'TSLA';
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect1.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect2.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect3.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect4.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect5.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect6.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect7.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect8.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });
    //
    // symbolSelect9.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     symbol = event.target[0].value;
    //     console.log(event.target[0].value);
    //     loadChartData(symbol, priceChart, areaSeries, symbolName, current);
    // });

    function updateChart() {
        let pricePromise = getNextPriceQuote()
            .then((latestQuote) => {
                try {
                    latestQuote = latestQuotes[currentSymbol];
                } catch (error) {
                    console.error(error);
                }

                if (latestQuote.lastUpdated < lastTimestamp + 60) {
                    areaSeries.update({
                        time: lastTimestamp,
                        value: latestQuote.price
                    })
                } else {
                    areaSeries.update({
                        time: latestQuote.lastUpdated,
                        value: latestQuote.price
                    })
                }

                updateCurrentQuoteHeading(current, latestQuote.price);
            })
            .catch(error => console.error(error));
        let timeOutPromise = new Promise(function (resolve, reject) {
            setTimeout(resolve, REFRESH_INTERVAL, 'Timeout Done')
        });

        Promise.all([pricePromise, timeOutPromise])
            .then(function (value) {
//                 console.log("At least 1 second + completed GET request");
                updateChart();
            });
    }
    updateChart();
});
