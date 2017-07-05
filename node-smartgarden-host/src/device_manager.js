'use strict';
var fs = require('fs');
var fileList = require('./lists.js');
var EventEmitter = require('events');
var DeviceClass = require('./device.js');
var zigbee = require('./zigbee_utils.js');
var decode = require('./interpreter.js');
var Device = DeviceClass.Device;
var _ = require('./underscore.js');

// ------------------------------------

var myDevice = {};

// ----- device management -------------------------------
function getType(macCapability) {

    if (macCapability == '10000000' || macCapability == '10000011') {
        return DeviceClass.SWITCH;
    }
    else if (macCapability == '10001110' || macCapability == '10000100' || macCapability == '00010010') {
        return DeviceClass.SOCKET;
    }
    // add more
    else {
        console.log('unidentified device type');
        return DeviceClass.UNKNOWN;
    }
}
// ---------------- find device ------------------
function findDeviceShort(msg, targetList) {

    console.log('--- find device short triggered');
    console.log('--- msg shortADDR: ' + msg.shortAddress);
    console.log('--- targetlist: ' + targetList);

    targetList.forEach(function (m) {
        console.log(m);
    });

    var obj = _.find(targetList, function (dev) {
        console.log('--- dev Short: ' + dev.shortAddress);
        return dev.shortAddress == msg.shortAddress;
    });
    return obj;
}

function findDeviceLong(msg, targetList) {

    console.log('--- find device long triggered');
    console.log('--- msg IEEE: ' + msg.IEEEAddress);

    var obj = _.find(targetList, function (dev) {
        console.log('--- dev IEEE: ' + dev.IEEEAddress);
        return dev.IEEEAddress == msg.IEEEAddress;
    });
    return obj;
}

function findDevice(msg, targetList) {
    if (msg.IEEEAddress !== undefined) {
        return findDeviceLong(msg, targetList);
    }
    else {
        return findDeviceShort(msg, targetList);
    }
}

// ------------------------------------------------
function newDevice(msg) {

    console.log("--- IEEEADDR: " + msg.IEEEAddress);

    myDevice = new Device({
        shortAddress: msg.shortAddress,
        IEEEAddress: msg.IEEEAddress,
        type: getType(msg.macCapability),
        online: true
    });
    // push device into list
    console.log('Push new device into the deviceList');

    if (myDevice.IEEEAddress !== '0x0000000000000000') {
        console.log('Push new device into the deviceList');
        fileList.pushDevice(myDevice, fileList.deviceList);
        console.log('--- device list after push: ' + fileList.deviceList);

        // -------------write bind list----------------
        fileList.deviceList.forEach(function (device) {

            var objA = findDevice(msg, fileList.bindListA);
            var objB = findDevice(msg, fileList.bindListB);

            if (objA || objB) {
                console.log('device existed in bind list');
            }
            else if (device && device.type === 16) {
                console.log('-------- changing binding list --------');
                fileList.bindListA.push(device);
                console.log('==== device pushed in group A: ' + device.IEEEAddress);
            }
            else if (device && device.type === 17) {
                console.log('-------- changing binding list --------');
                fileList.bindListB.push(device);
                console.log('==== device pushed in group B: ' + device.IEEEAddress);
            }
        });
        // --------------------------------------------------

    }
    else {
        console.log('--- invalid IEEEaddress, can not be added');
        myDevice = {};
    }
}

function leaveDevice(obj) {
    console.log('--- print leave obj');
    console.log(obj);

    if (obj !== undefined) {
        obj.online = false;
        fileList.removeDevice(fileList.deviceList, obj.IEEEAddress);
        fileList.removeDevice(fileList.bindListA, obj.IEEEAddress);
        fileList.removeDevice(fileList.bindListB, obj.IEEEAddress);

        fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
        fileList.writeList(fileList.BIND_LISTA, fileList.bindListA);
        fileList.writeList(fileList.BIND_LISTB, fileList.bindListB);
    } else {
        console.log('leave obj does not exist in list');
    }
}

function announceDevice(obj, msg, myDevice) {
    if (obj !== undefined) {
        console.log('Found obj in deviceList');
        console.log(obj);
        obj.online = true;
    } else {
        console.log('Could not find obj in deviceList');
        // new device instance
        newDevice(msg);
        fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
        fileList.writeList(fileList.BIND_LISTA, fileList.bindListA);
        fileList.writeList(fileList.BIND_LISTB, fileList.bindListB);
    }
}

function attributeAddDevice(obj, msg, myDevice) {
    if (obj !== undefined) {
        console.log('===obj exists in list===')
    } else if (msg.clusterID !== '0x0006') {
        console.log('--- undefined cluster ID');
    } else {
        console.log('Could not find reported obj in deviceList')
        // new device instance
        newDevice(msg);
        fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
        fileList.writeList(fileList.BIND_LISTA, fileList.bindListA);
        fileList.writeList(fileList.BIND_LISTB, fileList.bindListB);


    }

}

function attributeControl(msg) {
    switch (msg.clusterID) {

        case '0x0006':
            console.log('--- cluster ID 0x0006 identified');
            var obj = findDevice(msg, fileList.bindListA);


            if (obj) {
                fileList.bindListB.forEach(function (Dev) {
                    if (Dev) {
                        console.log('======== device turned on: ' + Dev.shortAddress);
                        zigbee.custToggleLight(Dev.shortAddress);
                    }
                });
            }
            else {
                console.log('==== no responder in list B ====');
                console.log('--- bind list A: ' + fileList.bindListA);
                console.log('--- bind list B: ' + fileList.bindListB);

            }
    }
}

//=======================

function readMessage(msg) {
    var obj = {};
    var myDevice = {};
    // var deviceList = fileList.getList(fileList.deviceList);
    // bindList.groupA = fileList.getList(fileList.bindListA);
    // bindList.groupB = fileList.getList(fileList.bindListB);


    switch (msg.msgType) {
        case 'Leave Indication':
            obj = findDevice(msg, fileList.deviceList);
            leaveDevice(obj);
            break;

        case 'Device Announce':
            obj = findDevice(msg, fileList.deviceList);
            announceDevice(obj, msg, myDevice);
            break;

        case 'Attribute Report':
            obj = findDevice(msg, fileList.deviceList);
            attributeAddDevice(obj, msg, myDevice);
            attributeControl(msg);
            break;
    }
}

module.exports = {

    // checkFile: checkFile,
    // writeDeviceList: writeDeviceList,
    // isDeviceJoined: isDeviceJoined,
    // resetDeviceList: resetDeviceList,

    readMessage: readMessage,

}
// module.exports.readMessage = readMessage;
// module.exports.checkBindList = checkBindList;
// module.exports.writeBindList = writeBindList;
// module.exports.attributeControl = attributeControl;