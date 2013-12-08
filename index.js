var historyTrade = require('./historyTrade');

var coin = 'ltc';
var filename = './data.csv';

historyTrade.recent(10000, coin, function(data) {
    historyTrade.save(filename, data, function(err) {
        console.log('data saved!');
    });
});