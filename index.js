var historyTrade = require('./historyTrade');
var fs = require('fs');
    
var coin = 'ltc';
var filename = './data.csv';

//historyTrade.requestOnce(coin, 12000, function(err, data) {
//    if (err) {
//        console.error('request failed! %s', err.message);
//    } else {
//        fs.writeFile(filename, data, function(e) {
//            if (e) throw e;
//            console.log('data saved!');
//        });
//    }
//});

historyTrade.recent(200, coin, function(data) {
    historyTrade.save(filename, data, function(err) {
        if (err) throw err;
        console.log('data saved!');
    });
});