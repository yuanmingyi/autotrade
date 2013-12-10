var historyTrade = require('../historyTrade');
var fs = require('fs');
var assert = require('assert');
var utility = require('./testUtility');

var coin = 'ltc';
var filename = utility.getUnitTestPath('testdata.txt');
var startTid = 100000;
var endTid = 100200;

historyTrade.data(coin, startTid, endTid, function(data) {    
    assert(data instanceof Array);
    var lastTid = startTid;
    
    for (var i = 0; i < data.length; i++) {
        assert.strictEqual(typeof data[i].amount, 'number');
        assert(data[i].date instanceof Date);
        assert.strictEqual(typeof data[i].price, 'number');
        assert.strictEqual(typeof data[i].tid, 'number');
        assert.strictEqual(typeof data[i].type, 'string');
        assert(data[i].tid > lastTid);
        lastTid = data[i].tid;
    }
    assert(lastTid <= endTid);
    
    fs.writeFile(filename, JSON.stringify(data), function(err) {
        if (err) console.log(err.message);
        else console.log('data saved!');
    });
});
