'use strict';

var dgram = require("dgram");
var server = dgram.createSocket('udp4');
var zigbee = require('./zigbee_utils.js');
var fileList = require('./lists.js');
var PORT = 0;
var GATEWAY_ID = 0;


function parse(msg) {
    if (msg.cmd == 'ping') {
        return parse_cmd_ping(msg);
    }
    else if (msg.cmd == 'startnetwork') {
        zigbee.startNetwork();
        return { cmd: 'startnetwork_rsp' };
    }
    else if (msg.cmd == 'clean') {
        fileList.resetList(fileList.deviceList);
        fileList.resetList(fileList.bindListA);
        fileList.resetList(fileList.bindListB);

        fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
        fileList.writeList(fileList.BIND_LISTA, fileList.bindListA);
        fileList.writeList(fileList.BIND_LISTB, fileList.bindListB);

        return { cmd: 'clean_rsp' };
    }
    else if (msg.cmd == 'permitjoining') {
        // 允许设备加入
        zigbee.permitJoiningRequest();

        return { cmd: 'permitjoining_rsp' };
    }
    else if (msg.cmd == 'list') {

        console.log('--- pre list device list: ' + fileList.deviceList);
        return {
            cmd: 'list_rsp',
            content: JSON.stringify(fileList.deviceList)
        };
    }
    else {// unknown command                                                                             
        return {
            cmd: 'unknown_cmd'
        };
    }

}

function parse_cmd_ping(msg) {
    var feedback = {};
    feedback.cmd = 'ping_rsp';
    feedback.id = GATEWAY_ID;
    return feedback;
}


server.on("error", function (err) {
    console.log("server error:\n" + err.stack);
    server.close();
});

server.on("message", function (msg, rinfo) {
    console.log("server got: " + msg + " from " +
        rinfo.address + ":" + rinfo.port);
    var msgObj;

    try {
        msgObj = JSON.parse(msg);

    } catch (e) {
        console.log("wrong JSON msg");
        console.log(e);
        return;
    }

    console.log(msgObj.cmd);

    var feedback = parse(msgObj);

    var msg2 = JSON.stringify(feedback);

    server.send(msg2,
        0,
        msg2.length,
        rinfo.port,
        rinfo.address,
        function (err, bytes) {
            if (err)
                throw err;
        }
    );

});

server.on("listening", function () {
    var address = server.address();
    console.log("server listening " +
        address.address + ":" + address.port);
});


function start(options) {
    PORT = options.port || 33333;
    GATEWAY_ID = options.id || 'gateway_01';

    server.bind(PORT);

}



module.exports.start = start;











