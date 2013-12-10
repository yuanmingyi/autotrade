var historyTrade = require('./historyTrade');
var fs = require('fs');
    
var coin = 'ltc';
var filename = './data.csv';

//historyTrade.data(coin, 300, 1000, function(data) {
//    historyTrade.save(filename, data, function(err) {
//        if (err) console.log(err.message);
//        else console.log('data saved!');
//    });
//});

//historyTrade.recent(coin, 10000, function(data) {
//    historyTrade.save(filename, data, function(err) {
//        if (err) throw err;
//        console.log('data saved!');
//    });
//});

historyTrade.updateRecent(filename, coin);

//historyTrade.since(coin, 4000000, function(data) {
//    historyTrade.save(filename, data, function(err) {
//        if (err) throw err;
//        console.log('data saved!');
//    });
//});