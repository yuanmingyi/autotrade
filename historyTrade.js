// download all the data from okcoin

var historyTrade = {};

(function() {
    var fs = require('fs');    
    var https = require('https');
    var zlib = require('zlib');
    var ncols = 5;
    
    // the head of table:
    // tid time price(cny) amount type
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
                amount: parseFloat(cols[3]),
                date: new Date(cols[1]),
                price: parseFloat(cols[2]),
                tid: parseInt(cols[0]),                
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
            str += data[x].tid + ','
            + data[x].date.toJSON() + ','
            + data[x].price.toFixed(3) + ','
            + data[x].amount.toFixed(3) + ','            
            + data[x].type + '\n';
        }
        return str;
    }
    
    function getURL(coin, since) {
        var urlPrefix = 'https://www.okcoin.com/api/trades.do?';
        if (coin === 'ltc') {
            urlPrefix += 'symbol=ltc_cny&';
        }
        return urlPrefix + 'since=' + since;
    }
    
    var load = historyTrade.load = function (filename, callback) {
        fs.readFile(filename, function (err, logData) {
            var text = err ? "" : logData.toString();
            var data = parseDataFromFile(text);
            callback(err, data);
        });
    };
    
    var save = historyTrade.save = function (filename, data, callback) {
        var str = prepareOutputData(data);
        fs.writeFile(filename, str, function (err) { 
            callback(err);
        });
    };
    
    var requestOnce = historyTrade.requestOnce = function (coin, since, callback) {
        var url = getURL(coin, since);
        https.get(url).on('error', function(err) {            
            callback(err, null);
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
        
    var requestData = historyTrade.data = function (coin, startTid, endTid, callback) {
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

    var requestSince = historyTrade.since = function (coin, since, callback) {
        requestData(coin, since, Infinity, callback);
    };

    var requestRecent = historyTrade.recent = function (coin, diff, callback) {
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
                        requestData(coin, endTid - diff, data[0].tid - 1, function (d) {
                            callback(d.concat(data));
                        });
                    } else {
                        console.log('finished download');
                        callback(data);
                    }
                } else {
                    console.log('no data downloaded');
                }
            } else {
                console.error('Got error: %s', err.message);
            }
        });
    };
    
    var updateRecent = historyTrade.updateRecent = function (filename, coin, callback) {
        load(filename, function (err, data) {
            var length = data.length;
            var startTid = length > 0 ? data[length-1].tid : 1;
            requestSince(coin, startTid, function (newData) {
                data = data.concat(newData);
                save(filename, data, function (err) {
                    if (err) {
                        console.error('failed in save file!');
                    } else {
                        console.log('data saved! total %d records', data.length);
                    }
                    callback(err);
                });
            });
        });
    };

    var updateHistory = historyTrade.updateHistory = function (filename, coin, callback) {
        load(filename, function (err, data) {
            var length = data.length;
            var endTid = length > 0 ? data[0].tid - 1 : Infinity;
            requestData(coin, 1, endTid, function (oldData) {
                data = oldData.concat(data);
                save(filename, data, function (err) {
                    if (err) {
                        console.error('failed in save file!');
                    } else {
                        console.log('data saved! total %d records', data.length);
                    }
                    callback(err);
                });
            });
        });
    };
}());

module.exports = historyTrade;