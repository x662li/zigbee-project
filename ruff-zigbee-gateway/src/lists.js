'use strict';
var fs = require('fs');

var deviceList = [];
var relationList = [];

var listArray = [];

var DEVICE_LIST = '/home/devices.json';
var RELATION_LIST = '/home/relations.json';

listArray.push(deviceList);
listArray.push(relationList);


function getList(listName) {
    return listName;
}

function pushDevice(device, listName) {
    listName.push(device);
}

function checkFile(FILE_NAME, listName) {
    fs.exists(FILE_NAME, function (exists) {
        console.log('list exists: ', exists);
        //console.log(require('/etc/devices'));
        if (exists) {
            fs.readFile(FILE_NAME, function (err, data) {
                if (err) throw err;

                var devices = JSON.parse(data).listName;
                if (devices) {
                    console.log('--- list exists: ' + FILE_NAME);
                    // copy array
                    for(var i in devices){
                      listName.push(devices[i]);
                    }

                } else {
                    listName = [];
                }
                //console.log('get stored devices: ', deviceList);
            });
        }
        else {
          console.log('file does not exist');
        }
    });
}

function writeList(FILE_NAME, listName) {
    var toSaveObj = {
        listName: listName
    }
    fs.writeFile(FILE_NAME, JSON.stringify(toSaveObj), function (err) {
        if (err) throw err;
        console.log('Device List saved!');
    });
}


function removeDevice(listName, deviceExtendedAddress) {

  console.log('--- listName: ' + listName);

    for (var i = listName.length; i >= 0; i--) {
      console.log('--- long address' + listName[i].IEEEAddress);
        if (listName[i].IEEEaddress == deviceExtendedAddress) {
            console.log('--- find IEEE address to be removed');
            listName = listName.splice(i, 1);
        }
    }
}

function resetList(listName) {
    //console.log
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
    relationList: relationList,
    DEVICE_LIST: DEVICE_LIST,
    RELATION_LIST: RELATION_LIST,
    listArray: listArray
}
