// download all the data from okcoin

var historyTrade = {};

(function() {
    var fs = require('fs');    
    var https = require('https');   
    var ncols = 5;
    
    function parseDataFromFile(data) {
        var allData = [];
        var rows = data.split("\n");
        for (var x in rows) {
            var row = rows[x];
            var cols = row.split(",");
            if (cols.length !== ncols) {
                continue;
            }
            allData.push({
                amount: parseFloat(cols[0]),
                date: new Date(cols[1]),
                price: parseFloat(cols[2]),
                tid: parseInt(cols[3]),
                type: cols[4]
            });
        }
        allData.sort(function (a, b) {
            return a.tid - b.tid;
        });
        return allData;
    }
    
    function parseDataFromJson(data, startTid, endTid) {
        var allData = [];
        for (var i = 0; i < data.length; i++) {
            var d = data[i];
            if (d.tid <= startTid) {
                continue;
            }
            if (d.tid > endTid) {
                break;
            }
            allData.push({
                amount: parseFloat(d.amount),
                date: new Date(d.date * 1000),
                price: parseFloat(d.price),
                tid: d.tid,
                type: d.type
            });
        } 
        return allData;
    }
    
    function prepareOutputData(data) {
        var str = "";
        for (var x in data) {
            str += data.amount.toFixed(3) + ','
            + data.date.toJson() + ','
            + data.price.toFixed(3) + ','
            + data.tid + ','
            + data.type + '\n';
        }
        return str;
    }
    
    function getURL(since, coin) {
        var urlPrefix = 'https://www.okcoin.com/api/trades.do?';
        if (coin === 'ltc') {
            urlPrefix += 'symbol=ltc_cny&';
        }
        return urlPrefix + 'since=' + since;
    }
        
    function recursiveRequest(startTid, endTid, coin, allData, func) {
        // the return data's tid is within the interval: (startTid, endTid]
        var url = getURL(startTid, coin);
        https.get(url, function (res) {
            res.on('data', function (chunk) {
                var jsonData = [];
                try {
                    jsonData = JSON.parse(chunk);
                } catch(e) {
                    console.log('exception at: startTid:' + startTid + ' endTid:' + endTid + ' chunk:' + chunk);
                }
                var data = parseDataFromJson(jsonData, startTid, endTid);
                if (data.length > 0) {
                    allData = allData.concat(data);
                    console.log('downloaded ' + allData.length + ' records');
                    if (jsonData[jsonData.length - 1].tid < endTid) {
                        recursiveRequest(allData[allData.length-1].tid, endTid, coin, allData, func);
                        return;
                    }
                }
                // cannot download any more data
                console.log('finished download');
                func(allData);          
            });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    }

    historyTrade.since = function requestSince (since, coin, func) {
        requestData(since, Infinity, coin, func);
    };
    
    historyTrade.data = function requestData (startTid, endTid, coin, func) {
        var allData = [];
        recursiveRequest(startTid, endTid, coin, allData, func);
    };

    historyTrade.recent = function requestRecent (diff, coin, func) {        
        var url = getURL('', coin);
        https.get(url, function (res) {
            res.on('data', function (chunk) {
                var jsonData = [];
                try {
                    jsonData = JSON.parse(chunk);
                } catch(e) {
                    console.log('exception at: requestRecent(). chunk:' + chunk);
                    return;
                }
                var endTid = jsonData[jsonData.length-1].tid;
                var data = parseDataFromJson(jsonData, endTid - diff, endTid);
                if (data.length > 0) {
                    console.log('downloaded ' + allData.length + ' records');
                    if (jsonData[0].tid > endTid - diff) {
                        var startTid = (endTid - diff > 0 ? endTid - diff : 1); 
                        recursiveRequest(endTid - diff, data[0].tid - 1, coin, [], function (d) {
                            d = d.concat(data);
                            func(d);
                        });
                    } else {
                        console.log('finished download');
                        func(data);
                    }
                }
            });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });     
    };

    historyTrade.load = function load (filename, func) {
        fs.readFile(filename, function (err, logData) {
            var text = err ? "" : logData.toString();
            var data = parseDataFromFile(text);
            func(data, err);
        });
    }
    
    historyTrade.save = function save (filename, data, func) {
        var str = prepareOutputData(data);
        fs.writeFile(filename, str, function (err) {            
            func(err);
        });
    }
    
    historyTrade.updateRecent = function downloadRecent (filename, coin) {
        load(filename, function (data) {
            var length = data.length;
            var startTid = length > 0 ? data[length-1].tid : 1;
            requestSince(startTid, coin, function (allData) {
                save(filename, allData, function (err) {
                    if (err) throw err;
                    console.log('data saved! total ' + allData.length + ' records');
                });
            });
        });        
    };
    
    historyTrade.updateOld = function downloadOld (filename, coin) {
        load(filename, function (data) {
            var length = allData.length;
            var endTid = length > 0 ? data[0].tid - 1: Infinity;
            requestData(1, endTid, coin, function (allData) {
                save(filename, allData, function (err) {
                    if (err) throw err;
                    console.log('data saved! total ' + allData.length + ' records');
                });
            });
        });
    };
}());

module.exports = historyTrade;