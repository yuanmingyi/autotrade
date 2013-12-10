var testUtility = {};

(function() {
    var fs = require('fs');    
    var path = require('path');
    
    var areSameFiles = testUtility.areSameFiles = function (file1, file2, callback) {
        fs.readFile(file1, function(err1, data1) {
            fs.readFile(file2, function(err2, data2) {
                callback(!err1 && !err2 && data1.toString() === data2.toString());
            });
        });
    };
    
    var doesFileStartWithFile = testUtility.doesFileStartWithFile = function (file1, file2, callback) {
        fs.readFile(file1, function(err1, data1) {
            fs.readFile(file2, function(err2, data2) {
                callback(!err1 && !err2 && data1.toString().slice(0,data2.toString().length) === data2.toString());
            });
        });
    };
    
    var doesFileEndWithFile = testUtility.doesFileEndWithFile = function (file1, file2, callback) {
        fs.readFile(file1, function(err1, data1) {
            fs.readFile(file2, function(err2, data2) {
                callback(!err1 && !err2 && data1.toString().slice(-data2.toString().length) === data2.toString());
            });
        });
    };
    
    var copyFile = testUtility.copyFile = function (srcFile, dstFile, callback) {
        fs.readFile(srcFile, function(err, data) {
            if (err) {
                callback(err);
            } else {
                fs.writeFile(dstFile, data, function(err) {
                    callback(err);
                });
            }
        });
    };
    
    var paths = {
        unittest: './unittest',
        tmp: './tmp'
    };
    
    var getUnitTestPath = testUtility.getUnitTestPath = function (relativePath) {
        return path.join(paths.unittest, relativePath);
    };
    
}());

module.exports = testUtility;