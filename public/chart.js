const LAST_500_POINTS = 30000;
const CHART_INTERVAL = "1";
const EDT_OFFSET = 14400;

const CHART_WIDTH_PERCENTAGE = 0.9;
const CHART_HEIGHT_PERCENTAGE  = 0.7;

let lastTimestamp;

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
        .then(response => response.json())
}

function getCryptoCandle(symbol, interval, from, to) {
    return fetch('/finnhub/crypto/?symbol=' + symbol + '&interval=' + interval + '&from=' + from + '&to=' + to)
        .then(response => response.json())
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

function loadChartData(symbol, scale, chart, series, symbolName, current, updated) {
    let to = getUTCTimestampSeconds();
    let from = to - LAST_500_POINTS;

    getCryptoCandle(symbol, CHART_INTERVAL, from, to)
        .then(data => {
            symbolName.innerText = symbol;

            let priceData = finnCandleToLineData(data);
            series.setData(priceData);

            chart.timeScale().fitContent();
            lastTimestamp = to;

            updateQuote(current, priceData[priceData.length - 1].value, updated);
        });
}

function updateQuote(current, currentPrice, updated) {
    current.innerText = currentPrice.toFixed(2);
    updated.innerText = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}) + " EDT";
}

document.addEventListener('DOMContentLoaded', function() {
    const chartBody = document.getElementById('chart');
    const graphContainer = document.getElementById('graphContainer');
    const symbolName = document.getElementById('symbol-name');
    const symbolSelectForm = document.getElementById('symbol-select');
    const symbolSelect1 = document.getElementById('symbol-select1');
    const symbolSelect2 = document.getElementById('symbol-select2');


    const current = document.getElementById('price-current');
    const updated = document.getElementById('last-updated');

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
    resizeChart();
    const areaSeries = priceChart.addAreaSeries({lineWidth: 1});

    function resizeChart() {
        priceChart.applyOptions({
            width: Math.floor(graphContainer.offsetWidth * CHART_WIDTH_PERCENTAGE),
            height: Math.floor(graphContainer.offsetHeight * CHART_HEIGHT_PERCENTAGE)
        });
    }

    window.onresize = resizeChart;

    let symbol = "BINANCE:BTCUSDT";
    let scale = "day";

    loadChartData(symbol, scale, priceChart, areaSeries, symbolName, current, updated);

    symbolSelectForm.addEventListener('submit', (event) => {
        event.preventDefault();
        symbol = event.target[0].value;
        // symbol = 'TSLA';
        console.log(event.target[0].value);
        loadChartData(symbol, 'day', priceChart, areaSeries, symbolName, current, updated);
    });

    symbolSelect1.addEventListener('submit', (event) => {
        event.preventDefault();
        symbol = event.target[0].value;
        console.log(event.target[0].value);
        loadChartData(symbol, 'day', priceChart, areaSeries, symbolName, current, updated);
    });

    symbolSelect2.addEventListener('submit', (event) => {
        event.preventDefault();
        symbol = event.target[0].value;
        console.log(event.target[0].value);
        loadChartData(symbol, 'day', priceChart, areaSeries, symbolName, current, updated);
    });

    function updateChart() {
        getFinnQuote(symbol)
            .then(data => {
                let currentTimestamp = UTCtoEDT(getUTCTimestampSeconds());
                if (currentTimestamp < lastTimestamp + 60) {
                    areaSeries.update({
                        time: lastTimestamp,
                        value: data.c
                    });
                } else {
                    areaSeries.update({
                        time: currentTimestamp,
                        value: data.c
                    });
                    lastTimestamp = currentTimestamp;
    }

                updateQuote(current, data.c, updated);
            })
    }

    const refreshChart = setInterval(updateChart, 1000);
});
