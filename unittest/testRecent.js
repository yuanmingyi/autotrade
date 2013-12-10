var historyTrade = require('../historyTrade');
var utility = require('./testUtility');
var assert = require('assert');

var coin = 'ltc';
var file0 = utility.getUnitTestPath('testRecent0.csv');
var file1 = utility.getUnitTestPath('testRecent1.csv');

var diff0 = 10;
var diff1 = 1000;

function testRecent(filename, diff) {
    historyTrade.recent(coin, diff, function(data) {
        assert(data.length <= diff);
        historyTrade.save(filename, data, function(err) {
            assert.ifError(err);
        });
    });    
}

testRecent(file0, diff0);
testRecent(file1, diff1);