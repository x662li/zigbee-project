'use strict';
var fs = require('fs');

var deviceList = [];
var bindListA = [];
var bindListB = [];

var DEVICE_LIST = './devices';
var BIND_LISTA = './bindListA';
var BIND_LISTB = './bindListB';


function getList(listName) {
    return listName;
}

function pushDevice(device, listName) {
    listName.push(device);
}

function checkFile(FILE_NAME) {
    fs.exists(FILE_NAME, function (exists) {
        console.log('devices exists: ', exists);
        //console.log(require('/etc/devices'));
        if (exists) {
            fs.readFile(FILE_NAME, function (err, data) {
                if (err) throw err;

                var devices = JSON.parse(data).deviceList;
                if (devices) {
                    console.log('--- list exists: ' + FILE_NAME);
                    deviceList = devices;
                } else {
                    deviceList = [];
                }
                //console.log('get stored devices: ', deviceList);
            });
        }
    });
}

function writeList(FILE_NAME, listName) {
    var toSaveObj = {
        listName: listName
    }
    fs.writeFile(FILE_NAME, JSON.stringify(toSaveObj), function (err) {
        if (err) throw err;
        //console.log('To Save Devices: ', deviceList);
        console.log('Device List saved!');
    });
}


function removeDevice(listName, deviceExtendedAddress) {
    for (var i = listName.length - 1; i >= 0; i--) {
        if (listName[i].IEEEaddress == deviceExtendedAddress) {
            listName = listName.splice(i, 1);
        }
    }
}

function resetList(listName) {
    listName = [];
}

// traverse device list and identify
function isDeviceJoined(listName, deviceParameter) {
    for (var i = 0; i < listName.length; i++) {
        // TODO should be device unique identifier
        if (listName[i].IEEEaddress === deviceParameter) {
            return true;
        }
    }
    return false;
}

module.exports = {
    checkFile: checkFile,
    writeList: writeList,
    isDeviceJoined: isDeviceJoined,
    resetList: resetList,
    getList: getList,
    pushDevice: pushDevice,
    removeDevice: removeDevice,
    deviceList: deviceList,
    bindListA: bindListA,
    bindListB: bindListB,
    DEVICE_LIST: DEVICE_LIST,
    BIND_LISTA: BIND_LISTA,
    BIND_LISTB: BIND_LISTB
}
