var historyTrade = require('../historyTrade');
var utility = require('./testUtility');
var assert = require('assert');

var coin = 'ltc';
var file0 = utility.getUnitTestPath('testData0.csv');
var file1 = utility.getUnitTestPath('testData1.csv');
var file2 = utility.getUnitTestPath('testData2.csv');
var gt0 = utility.getUnitTestPath('realData0.csv');
var gt1 = utility.getUnitTestPath('realData1.csv');
var gt2 = utility.getUnitTestPath('realData2.csv');

var data0 = [];

var data1 = [
    {amount: 33.45,
     date: new Date('2013-08-11T09:30:10.000Z'),
     price: 325.1234,
     tid: 12345678,
     type: 'buy'
    }
];
     
var data2 = [
    {amount: 0.5,
     date: new Date('2013-12-10T05:49:33.000Z'),
     price: 150.0,
     tid: 100000,
     type: 'buy'
    },
    {amount: 9999.0,
     date: new Date('2013-12-10T12:03:45.000Z'),
     price: 152.1,
     tid: 100002,
     type: 'buy'
    },
    {amount: 1234,
     date: new Date('2013-12-11T08:23:06.000Z'),
     price: 225.52,
     tid: 100005,
     type: 'sell'
    },
    {amount: 345.678,
     date: new Date('2013-12-12T22:10:15.000Z'),
     price: 200.003,
     tid: 100008,
     type: 'buy'
    }
];

function testSave(filename, gt, data) {
    historyTrade.save(filename, data, function(err) {
        assert.ifError(err);
        utility.areSameFiles(filename, gt, function(same) {
            assert(same);
        });
    });
}

testSave(file0, gt0, data0);
testSave(file1, gt1, data1);
testSave(file2, gt2, data2);