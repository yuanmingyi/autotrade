// test the requestOnce

var historyTrade = require('../historyTrade');
var fs = require('fs');
var assert = require('assert');
var utility = require('./testUtility');

var coin = 'ltc';
var filename = utility.getUnitTestPath('testOnce.txt');
var gt = utility.getUnitTestPath('realOnce.txt');
var startTid = 1200;

historyTrade.requestOnce(coin, startTid, function(err, data) {
    assert.ifError(err);
    assert(typeof(data), 'string');
    
    fs.writeFile(filename, data, function(err) {
        assert.ifError(err);
        utility.areSameFiles(filename, gt, function(same) {
            assert(same);
        });
    });
});