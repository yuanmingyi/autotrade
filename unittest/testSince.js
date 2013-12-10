var historyTrade = require('../historyTrade');
var utility = require('./testUtility');
var assert = require('assert');

var coin = 'ltc';
var file0 = utility.getUnitTestPath('testSince0.csv');
var file1 = utility.getUnitTestPath('testSince1.csv');

var start0 = 4729100;
var start1 = 4729230;

function testSince(filename, since) {
    historyTrade.since(coin, since, function(data) {        
        assert(!data.length || data[0].tid > since);
        historyTrade.save(filename, data, function(err) {
            assert.ifError(err);
        });
    });    
}

testSince(file0, start0);
testSince(file1, start1);