var historyTrade = require('../historyTrade');
var utility = require('./testUtility');
var assert = require('assert');

var coin = 'ltc';
var testfile = utility.getUnitTestPath('testUpdateHistory.csv');
var datafile = utility.getUnitTestPath('sampleData1.csv');

utility.copyFile(datafile, testfile, function(err) {
    assert.ifError(err);
    historyTrade.updateHistory(testfile, coin, function(err) {
        assert.ifError(err);
        utility.doesFileEndWithFile(testfile, datafile, function(result) {
            assert(result);
        });
    });
});