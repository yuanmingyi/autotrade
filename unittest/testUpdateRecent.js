var historyTrade = require('../historyTrade');
var utility = require('./testUtility');
var assert = require('assert');

var coin = 'ltc';
var testfile = utility.getUnitTestPath('testUpdateRecent.csv');
var datafile = utility.getUnitTestPath('sampleData0.csv');

utility.copyFile(datafile, testfile, function(err) {
    assert.ifError(err);
    historyTrade.updateRecent(testfile, coin, function(err) {
        assert.ifError(err);
        utility.doesFileStartWithFile(testfile, datafile, function(result) {
            assert(result);
        });
    });
});