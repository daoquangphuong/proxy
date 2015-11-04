process.title = 'node-proxy';
var net = require('net');
var server = net.createServer(function (client) { //'connection' listener
    console.log('client connected');
    var auth = false;
    var remote = false;
    client.on('data', function (data) {
        //console.log(data);
        var version = data.readUInt8(0);
        // check auth
        if (!auth) {
            var authMethodSupport = data.readUInt8(1);
            var authMethod = data.readUInt8(2);
            var buffer = new Buffer(2);
            if (version == 5) {
                buffer[0] = 0x05;// version 5
                buffer[1] = 0x00;// no auth
            }
            auth = true;
            return client.write(buffer);
        }
        // client connection request
        var commandCode = data.readUInt8(1);
        //0x01 = establish a TCP/IP stream connection
        //0x02 = establish a TCP/IP port binding
        //0x03 = associate a UDP port
        var reserved = data.readUInt8(2);
        //must be 0x00
        var addressType = data.readUInt8(3);
        //0x01 = IPv4 address
        //0x03 = Domain name
        //0x04 = IPv6 address
        var destinationAddress;
        var destinationPort;
        var i;
        switch (addressType) {
            case 1:
                //4 bytes for IPv4 address
                destinationAddress = [];
                for (i = 4; i < 4 + 4; i++) {
                    destinationAddress.push(data.readUInt8(i));
                }
                destinationAddress = destinationAddress.join('.');
                //2 bytes for Port
                destinationPort = data.readUInt16BE(8);
                break;
            case 3:
                //1 byte of name length followed by the name for Domain name
                var destinationAddressLength = data.readUInt8(4);
                destinationAddress = data.toString('utf8', 5, 5 + destinationAddressLength);
                //2 bytes for Port
                destinationPort = data.readUInt16BE(5 + destinationAddressLength);
                break;
            case 4:
                //16 bytes for IPv6 address
                destinationAddress = [];
                for (i = 4; i < 4 + 16; i++) {
                    destinationAddress.push(data.readUInt8(i));
                }
                destinationAddress = destinationAddress.join('.');
                //2 bytes for Port
                destinationPort = data.readUInt16BE(20);
                break;
        }
        if (!remote) {
            remote = net.connect({host: destinationAddress, port: destinationPort}, function () {
                console.log('connected to Remote ', destinationAddress, destinationPort);
                data[1] = 0x00;
                client.write(new Buffer(data));
            });

            remote.on('data', function (data) {
                client.write(data)
            });

            remote.on('error', function (err) {
                console.log('REMOTE', err);
            });

            remote.on('end', function (data) {
                console.log('remote disconnected');
                client.end(data);
            });
            return;
        }
        console.log(data.toString());
        remote.write(data);
    });

    client.on('error', function (err) {
        console.log('CLIENT', err.stack);
    });

    client.on('end', function () {
        console.log('client disconnected');
    });
});
server.listen(1234, function () { //'listening' listener
    console.log('server bound');
});