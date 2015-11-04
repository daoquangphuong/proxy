var net = require('net');
var q = require('q');

var Cache = function () {
    var self = this;
    self.data = {};
};

var cache = Cache.prototype;

cache.download = function (host, port, requestString, num) {
    return q.Promise(function (resolve, reject) {
        var DATA = [];
        if (typeof num != 'undefined') {
            var oldNum = requestString.match(/-(\d+)\.ts$/m);
            num = num.toString();
            if (oldNum.length > num.length) {
                num = '0000' + num;
                num = num.slice(-oldNum.length);
            }
            requestString = requestString.replace(/-(\d+)\.ts$/m, '-' + num + '.ts');
        }
        requestString = requestString.replace(/keep-alive/, 'close');
        var remote = net.connect({host: host, port: port}, function () {
            var buffer = new Buffer(requestString);
            remote.write(buffer);
        });

        remote.on('data', function (data) {
            DATA.push(data);
        });

        remote.on('error', function (err) {
            reject(err);
            console.log('REMOTE', err);
        });

        remote.on('end', function (data) {
            resolve(DATA);
            console.log('remote disconnected');
        });
    })
};

cache.getCache = function (host, port, req, header, requestString) {
    var self = this;
    return q.when()
        .then(function () {

        });
};


var _cache = new Cache();

//_cache.download('210.245.125.99', 80, "GET /fb7978c64aaf2ea8665c7eda63fd3710/phimbo/phimmy/2014/03/Continuum.S03/Continuum.S03E02.720p.2HD/Continuum.S03E02.720p.HDTV.x264-2HD-274.ts HTTP/1.1\r\nHost: s5.phimhd3s.com\r\nUser-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\nAccept-Language: vi-VN,vi;q=0.8,en-US;q=0.5,en;q=0.3\r\nAccept-Encoding: gzip, deflate\r\nConnection: keep-alive\r\n\r\n")
//    .then(function (data) {
//        console.log(data.length);
//    })
//    .done();

module.exports = _cache;