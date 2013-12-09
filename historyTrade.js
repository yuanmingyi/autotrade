// download all the data from okcoin

var historyTrade = {};

(function() {
    var fs = require('fs');    
    var https = require('https');
    var zlib = require('zlib');
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
            + data.date.toJSON() + ','
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
    
    historyTrade.load = function load (filename, callback) {
        fs.readFile(filename, function (err, logData) {
            var text = err ? "" : logData.toString();
            var data = parseDataFromFile(text);
            callback(data, err);
        });
    };
    
    historyTrade.save = function save (filename, data, callback) {
        var str = prepareOutputData(data);
        fs.writeFile(filename, str, function (err) { 
            callback(err);
        });
    };
    
    historyTrade.requestOnce = function requestOnce (coin, since, callback) {
        var url = getURL(since, coin);
        https.get(url).on('error', function(err) {
            console.error(err.message);
        }).on('response', function(response) {
            var chunks = [];
            response.on('data', function(chunk) {
                chunks.push(chunk);
            }).on('end', function() {
                var buffer = Buffer.concat(chunks);                
                switch (response.headers['content-encoding']) {
                    case 'gzip':
                        zlib.gunzip(buffer, function(err, decoded) {
                            callback(err, decoded && decoded.toString());
                        });                        
                        break;
                    case 'deflate':
                        zlib.inflate(buffer, function(err, decoded) {
                            callback(err, decoded && decoded.toString());
                        });
                        break;
                    default:
                        callback(null, buffer.toString());
                        break;
                }
            });
        });
    };
        
    historyTrade.data = function requestData (startTid, endTid, coin, callback) {
        // the return data's tid is within the interval: (startTid, endTid]
        var allData = [];        
        function handleData(err, data) {
            if (!err) {
                var json = [];
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    console.error('Got error: %s', e.message);
                }
                var records = parseDataFromJson(json, startTid, endTid);
                if (records.length > 0) {
                    allData = allData.concat(records);
                    console.log('downloaded ' + allData.length + ' records');
                    if (json[json.length - 1].tid < endTid) {
                        requestOnce(coin, allData[allData.length-1].tid, handleData);
                        return;
                    }
                }
            } else {
                console.error('Got error: %s', err.message);
            }
            console.log('finished download');
            callback(allData);
        }
        requestOnce(coin, startTid, handleData);
    }

    historyTrade.since = function requestSince (since, coin, callback) {
        requestData(since, Infinity, coin, callback);
    };

    historyTrade.recent = function requestRecent (diff, coin, callback) {
        requestOnce(coin, '', function(err, chunk) {
            if (!err) {
                var json = [];
                try {
                    json = JSON.parse(chunk);
                } catch (e) {
                    console.error('Got error: %s', e.message);
                }
                var endTid = json[json.length-1].tid;
                var data = parseDataFromJson(json, endTid - diff, endTid);
                if (data.length > 0) {
                    console.log('downloaded ' + data.length + ' records');
                    if (json[0].tid > endTid - diff) {
                        requestData(endTid - diff, data[0].tid - 1, coin, function (d) {
                            callback(d.concat(data));
                        });
                        return;
                    }
                } else {
                    console.error('Got error: %s', err.message);
                }
                console.log('finished download');
                callback(data);
            } else {
                console.error('request failed');
            }
        });
    };
    
    historyTrade.updateRecent = function updateRecent (filename, coin) {
        load(filename, function (data) {
            var length = data.length;
            var startTid = length > 0 ? data[length-1].tid : 1;
            requestSince(startTid, coin, function (allData) {
                save(filename, allData, function (err) {
                    if (err) throw err;
                    console.log('data saved! total %d records', allData.length);
                });
            });
        });
    };

    historyTrade.updateHistory = function updateHistory (filename, coin) {
        load(filename, function (data) {
            var length = data.length;
            var endTid = length > 0 ? data[0].tid - 1 : Infinity;
            requestData(1, endTid, coin, function (allData) {
                save(filename, allData, function (err) {
                    if (err) throw err;
                    console.log('data saved! total %d records', allData.length);
                });
            });
        });
    };
}());

module.exports = historyTrade;