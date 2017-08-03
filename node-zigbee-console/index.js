/**
 * @fileOverview
 * @name index.js
 * @author Yang Jun <yangjun@nanchao.org>
 * @license MIT license
 *
 * Zigbee gateway control console
 *
 */
'use strict';

var _ = require('underscore');
var ip = require('ip');

var PORT = 33333;
var HOST = '127.0.0.1';
var ADDR_BROADCAST = '';
var dgram = require('dgram');
// var message = new Buffer('My fungi is good.');

var messagePass = [];

var status = {
    gateway: ''

};

var state;

var client = dgram.createSocket('udp4');

function parse_msg(obj, server) {
    if (obj.cmd == 'ping_rsp') {
        console.log('server ip:' + server.address);

    }
    else if (obj.cmd == 'listdevices_rsp') {
        console.log('=================');

        var mObj = JSON.parse(obj.content);
        mObj.forEach(function (element) {
            console.log(element);
        });

    }

    else if (obj.cmd == 'listrelations_rsp') {
        console.log('==================');

        var mObj = JSON.parse(obj.content);
        mObj.forEach(function (element) {
            console.log(element);
        });
    }

    else if (obj.cmd == 'clean_rsp') {
        console.log('list cleaned');
    }
    // additional functions

    else if (obj.cmd == 'online_device_rsp') {
        console.log('==== online devices====')

        var mObj = JSON.parse(obj.content);
        mObj.forEach(function (element) {
            var state = 'NA';
            var leftState = 'NA';
            var rightState = 'NA';

            if (element.type == 0x20) {
                if (element.state === 1) {
                    state = 'ON';
                } else if (element.state === 0) {
                    state = 'OFF';
                }
                console.log(element.deviceID + '  ' + element.shortAddress + '  ' + state);
            }
            if (element.type == 0x21) {
                if (element.leftState == 1) {
                    leftState = 'ON';
                } else if (element.leftState == 0) {
                    leftState = 'OFF';
                }
                if (element.rightState == 1) {
                    rightState = 'ON';
                } else if (element.rightState == 0) {
                    rightState = 'OFF';
                }
                console.log(element.deviceID + '  ' + element.shortAddress + '  ' + leftState + '  ' + rightState);
            }
            else {
                console.log(element.deviceID + '  ' + element.shortAddress + '  ' + state);
            }
        })
    }

    else if (obj.cmd == 'savedevicelist_rsp') {
        console.log('device list saved');
    }
    else if (obj.cmd == 'saverelationlist_rsp') {
        console.log('relation list saved');
    }

    else if (obj.cmd == 'name_rsp') {
        console.log('name set already');
    }

    else if (obj.cmd == 'relation_rsp') {
        console.log('relation set already');
    }

    else if (obj.cmd == 'remove_rsp') {
        console.log('item removed');
    }

    else if (obj.cmd == 'control_rsp') {
        console.log('device triggered');
    }

    else if (obj.cmd == 'checkstatus_rsp') {
        console.log('status check triggered');
    }



}



client.on('listening', function () {
    console.log('Listening on address:' + client.address().address);
    console.log(ip.address());

    ADDR_BROADCAST = ip.subnet(ip.address(), '255.255.255.0').broadcastAddress;

    console.log('Broadcast address:' + ADDR_BROADCAST);
});

client.on("message", function (msg, rinfo) {
    console.log("client got: " + msg + " from " +
        rinfo.address + ":" + rinfo.port);

    var msgObj;

    try {
        msgObj = JSON.parse(msg);

    } catch (e) {
        console.log("wrong JSON msg");
        console.log(e);
        return;
    }

    parse_msg(msgObj, rinfo);
});

client.bind(function () {
    client.setBroadcast(true);
});


console.log('NXP JN5168A Zigbee console ( 2017 June ):');
console.log('Please join the same WIFI network as gateway');


print_help();

function print_help() {
    console.log('-------------------------');
    console.log('s: scan');
    console.log('status: 当前状态(默认网关ip)');
    console.log('g xx.xx.xx.xx: 设置网关ip\n'
        + 'listdevices: 显示当前网关上的所有设备信息\n'
        + 'listrelations: 显示所有关系\n'
        + 'off xxx: 关掉某盏灯\n'
        + 'on xxx: 打开某盏灯\n'
        + 'show xxx: 显示某盏灯的状态\n'
        + 'cleanrelationlist: 删除设备列表\n'
        + 'cleandevicelist: 删除设备列表\n'
        + 'channel xx: 设置工作信道\n'
        + 'permitjoining: 允许新设备加入'
        + 'onlinedevice: 显示在线设备名称列表\n'
        + 'name longAddress ID: 设备命名\n'
        + 'relation relationName emitterShort receiverShort emitterButton ReceiverButton 设置关系\n'
        + 'removedevice IEEEAddress 删除具体设备，危险，小心使用\n'
        + 'removerelation name 删除具体关系，小心使用\n'
        + 'savedevicelist 储存设备列表\n'
        + 'saverelationlist 储存关系列表\n'
        + 'control shortaddress button on||off 控制某个灯\n'
        + 'checkstatus shortaddress 检查设备的状态\n'
    );

    console.log('help: 帮助');
    console.log('q: 退出');
    console.log('-------------------------');
}

function send_single_cmd(cmd, jObj) {
    console.log('Send cmd:' + cmd);

    var msgObj = { cmd: cmd.toLowerCase() };

    if (jObj) {
        msgObj = _.extend(msgObj, jObj);
    }

    var message = JSON.stringify(msgObj);

    if (status.gateway == '') {
        console.log('status.gateway is empty');
        return;
    }

    client.send(
        message,
        0,
        message.length,
        PORT,
        status.gateway,
        function (err, bytes) {
            if (err)
                throw err;
        }
    );
}

// parse message

function parse_single(cmd) {
    var msgObj;
    var message;

    if (cmd == 'q') {
        console.log('退出');
        process.exit();
    }
    else if (cmd == 'h' || cmd == 'help') {
        print_help();
    }
    else if (cmd == 'S' || cmd == 'start') {

        msgObj = { cmd: 'ping' };
        message = JSON.stringify(msgObj);
        console.log('start udp connection');

        client.send(
            message,
            0,
            message.length,
            PORT,
            ADDR_BROADCAST,
            function (err, bytes) {
                if (err)
                    throw err;
                console.log('UDP message sent to ' + ADDR_BROADCAST + ':' + PORT);
            }
        );

    }
    else if (cmd == 'status') {
        console.log('client status:');
        console.log(status);
    }
    else if (cmd == 'listdevices') {
        send_single_cmd(cmd);
    }
    else if (cmd == 'listrelations') {
        send_single_cmd(cmd);
    }
    else if (cmd == 'permitjoining') {
        send_single_cmd(cmd);
    }
    else if (cmd == 'cleandevicelist') {
        send_single_cmd(cmd);
    }
    else if (cmd == 'cleanrelationlist') {
        send_single_cmd(cmd);
    }
    // additional functions
    else if (cmd == 'onlinedevice') {
        send_single_cmd(cmd);
    }
    else if (cmd == 'savedevicelist') {
        send_single_cmd(cmd);
    }
    else if (cmd == 'saverelationlist') {
        send_single_cmd(cmd);
    }
    else {
        console.log('Unrecognized cmd');
    }
}



// Input an array of commands
function parse_multi(cmds) {
    if (cmds[0] == 'g' || cmds[0] == 'gateway') {
        set_gateway_ip(cmds[1]);
    }
    else if (cmds[0] == 'channel') {
        console.log('Change channel to:' + cmds[1]);
        send_single_cmd(cmds[0], parseInt(cmds[1]));
    }
    // additional functions
    else if (cmds[0] == 'name') {
        console.log('long address: ' + cmds[1] + '\n' + 'name: ' + cmds[2]);
        send_single_cmd(cmds[0], {
            IEEEAddress: cmds[1],
            name: cmds[2]
        })
    }
    else if (cmds[0] == 'relation') {
        console.log('relation name: ' + cmds[1] + '\n' + 'emitter short: ' + cmds[2] + '\n' + 'receiver short: ' + cmds[3] + '\n' + 'emitter button' + cmds[4] + '\n'
            + 'receiver button' + cmds[5]);

        send_single_cmd(cmds[0], {
            relationName: cmds[1],
            emitterShort: cmds[2],
            receiverShort: cmds[3],
            emitterButton: cmds[4],
            receiverButton: cmds[5],
        })
    }
    else if (cmds[0] == 'removedevice') {
        console.log('remove IEEE: ' + cmds[1]);
        send_single_cmd((cmds[0]), {
            IEEEAddress: cmds[1]
        })
    }
    else if (cmds[0] == 'removerelation') {
        console.log('remove relation name: ' + cmds[1]);
        send_single_cmd(cmds[0], {
            name: cmds[1]
        })
    }
    else if (cmds[0] == 'control') {
        console.log('control light: ' + cmds[1] + ' ' + cmds[2] + '\n' + cmds[3]);
        send_single_cmd(cmds[0], {
            receiverShort: cmds[1],
            receiverButton: cmds[2],
            command: cmds[3]
        })
    }
    else if (cmds[0] == 'checkstatus') {
        console.log('check device with short address : ' + cmds[1] + ' button: ' + cmds[2]);
        messagePass.push(cmds[1]);
        messagePass.push(cmds[2]);
        send_single_cmd(cmds[0], {
            shortAddress: cmds[1],
            button: cmds[2]
        })
    }
    // add more here
    else {
        console.log('unrecognized command');
    }


}

function ValidateIPaddress(ipaddress) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return (true);
    }
    else {
        return (false);
    }
}

function set_gateway_ip(ip) {
    // if it's a valid ip format
    if (!ValidateIPaddress(ip)) {
        return;
    }

    status.gateway = ip;
    console.log(status);
}
/**
 *
 * @param {} data
 * data is a string , words separated by blank space
 */
function parse(data) {

    var strIn = data.toString().replace('\n', '').replace('\r', '');

    var strItems = strIn.split(' ');

    strItems = _.filter(strItems, function (a) {
        return (a !== '');
    });

    console.log('parse:' + strItems);

    if (strItems.length == 1) {
        parse_single(strItems[0]);
    }
    else if (strItems.length > 1) {
        parse_multi(strItems);
    }
    else {
        console.log('Unrecognized');
    }


}

// main()
process.stdin.resume();

process.stdin.on('data', function (data) {
    console.log("Get:" + data);
    //console.log("Data length:" + data.length);
    parse(data);

});
