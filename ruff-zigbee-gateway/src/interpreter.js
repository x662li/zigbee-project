// interpreter.js

/*

 start = 0x1
 end = 0x3
 data = [0x2, 0x44, 0xa6, 0x1, 0x1, 0x1]
 msgType = 146 = 0x92 (OnOff)
 msgLen = 0x6
 crc = 0x92 ^ 0x6 ^ 0x2 ^ 0x44 ^ 0xa6 ^ 0x1 ^ 0x1 ^ 0x1 = 0x75

 -----------------------------------------------------------------------------------
 |  0x1  |   0x92   |   0x6   |  0x75 |   0x2, 0x44, 0xa6, 0x1, 0x1, 0x1   |  0x3  |
 -----------------------------------------------------------------------------------
 | start | msgType  |  msgLen |  crc  |              Data                  |  stop |
 -----------------------------------------------------------------------------------

 0x00 0x92 -> 0x2 0x10^0x00 0x92

 ------------------------------------------------------------------------------------------------------------
 |  0x1  | 0x2 0x10 0x92 | 0x2 0x10 0x2 0x16 | 0x75 | 0x2 0x12 0x44 0xa6 0x2 0x11 0x2 0x11 0x2 0x11 |  0x3  |
 ------------------------------------------------------------------------------------------------------------
 | start |     msgType   |      msgLen       | crc  |                  Data                         |  stop |
 ------------------------------------------------------------------------------------------------------------

 */
'use strict';

var fs = require('fs');
var EventEmitter = require('events');
var DeviceClass = require('./device.js');
var Device = DeviceClass.Device;
var util = require('util');
var _ = require('./underscore.js');

var emitter = new EventEmitter();

function getEmitter() {
    return emitter;
}

var START = 0x1;
var STOP = 0x3;
var ESC = 0x2;
var MASK = 0x10;

function formatToUInt16BE(value) {
    var valueBuf = new Buffer(2);
    valueBuf.writeUInt16BE(value, 0);
    console.log('---===format16BE: ' + valueBuf.toString('hex'));
    return valueBuf;
}

function pack(msgType, msg) {
    var packet = new Buffer(1);
    packet.writeUInt8(START, 0);
    packet = Buffer.concat([packet, stuff(formatToUInt16BE(msgType))]);
    packet = Buffer.concat([packet, stuff(formatToUInt16BE(msg.length))]);
    packet = Buffer.concat([packet, stuff(crcCaculate(msgType, msg.length, msg))]);
    packet = Buffer.concat([packet, stuff(msg)]);
    packet = Buffer.concat([packet, Buffer.from([STOP])]);

    console.log('---===packet: ' + packet.toString('hex'));
    return packet;
}

function unpack(rawData) {
    var unstuffedData = unstuff(rawData);
    var slicedData = sliceData(unstuffedData);
    var parsedMessages = [];
    var protocolContent = parseMessage(slicedData);
    var parsedMessage = handleMessage(protocolContent);
    console.log('parsed message: ' + util.inspect(parsedMessage, {
        depth: 12
    }));
    parsedMessages.push(parsedMessage);
    console.log('parsed messages: ' + util.inspect(parsedMessages, {
        depth: 12
    }));
    return parsedMessages;
}

// mask message and push into buffer
function stuff(buffer) {
    var packet = [];
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i] < MASK) {
            packet.push(ESC);
            packet.push(buffer[i] ^ MASK);
        } else {
            packet.push(buffer[i]);
        }
    }
    return Buffer.from(packet);
}

// unmask raw data to meaningful data (Buffer type)
function unstuff(buffer) {
    var packet = [];
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i] === ESC) {
            i++;
            packet.push(buffer[i] ^ MASK);
        } else {
            packet.push(buffer[i]);
        }
    }
    return Buffer.from(packet);
}

function crcCaculate(msgType, msgLen, msg) {
    //var crcResult = msgType ^ msgLen;

    var crcResult = 0x00;

    crcResult ^= (msgType & 0xff00) >> 8;
    crcResult ^= (msgType & 0x00ff);
    crcResult ^= (msgLen & 0xff00) >> 8;
    crcResult ^= (msgLen & 0x00ff);

    for (var i = 0; i < msg.length; i++) {
        crcResult ^= msg[i];
    }
    return Buffer.from([crcResult]);
}

// check checksum of read data
function checkCheckSum(message) {
    var xorResult = 0;
    for (var i = 0; i < message.length; i++) {
        xorResult ^= Number('0x' + message[i]);
    }
    return xorResult === 0;
}

// slice raw data to readable data
function sliceData(data) {
    var slicedData = [];
    var strData = data.toString('hex');
    for (var i = 0; i < strData.length; i += 2) {
        slicedData.push(strData.slice(i, i + 2));
    }
    return slicedData;
}

// parse message and store as zigbee protocol segment
function parseMessage(msg) {
    var protocolContent = { valid: false };
    if (msg[0] === '01' && msg[msg.length - 1] === '03') {
        protocolContent.valid = checkCheckSum(msg.slice(1, -1));
        protocolContent.MsgType = '0x' + msg[1] + msg[2];
        protocolContent.MsgLength = Number('0x' + msg[3] + msg[4]);
        protocolContent.MsgContent = msg.slice(6, -1);
    }
    return protocolContent;
}

// handle message
function handleMessage(message) {
    var handledMessage = {};
    if (message.valid) {
        switch (message.MsgType) {
            case '0x004d':
                handledMessage = handleDeviceAnnounce(message.MsgContent);
                break;
            case '0x8000':
                handledMessage = handleStatusResponse(message.MsgContent);
                break;
            case '0x8001':
                handledMessage = handleLogMessage(message.MsgContent);
                break;
            case '0x8004':
                handledMessage = handleNodeClusterAttributeList(message.MsgContent);
                break;
            case '0x8005':
                handledMessage = handleNodeCommandIDList(message.MsgContent);
                break;
            case '0x8006':
                handledMessage = handleNonFactoryNewReset(message.MsgContent);
                break;
            case '0x8010':
                handledMessage = handleVersionList(message.MsgContent);
                break;
            case '0x8101':
                handledMessage = handleDefaultResponse(message.MsgContent);
                break;
            case '0x8102':
                handledMessage = handleAttributeReport(message.MsgContent);
                break;
            case '0x8100':
                handledMessage = handleReadAttributeResponse(message.MsgContent);
                //return handleReadAttributeResponse(message.MsgContent);
                break;
            case '0x8024':
                handledMessage = handleNetworkJoinedOrFormed(message.MsgContent);
                break;
            case '0x8048':
                handledMessage = handleLeaveIndication(message.MsgContent);
                break;
            default:
                console.log(message);
        }
    }
    return handledMessage;
}

// hex to ascii
function stringifyMessage(msg) {
    var temp = msg.map(function (e) {
        return Number('0x' + e);
    });
    temp = Buffer.from(temp);
    return temp.toString('ascii');
}

function getEntries(msg, entryLength) {
    var entries = [];
    var entry;
    for (var i = 0; i < msg.length; i += entryLength) {
        entry = msg.slice(i, i + entryLength).join('');
        entries.push(('0x' + entry));
    }
    return entries;
}

function handleAttributeReport(msg) {

    console.log('attribute handle: ' + msg.toString('hex'));
    var result = {};
    result.msgType = 'Attribute Report';
    result.sequenceNumber = ('0x' + msg[0]);
    result.shortAddress = ('0x' + msg[1] + msg[2]);
    result.endPoint = ('0x' + msg[3]);
    result.clusterID = ('0x' + msg[4] + msg[5]);
    result.attributeID = ('0x' + msg[6] + msg[7]);
    if (msg.length < 13) {
        result.attributeStatus = ('0x' + msg[8]);
        result.responseType = ('0x' + msg[9]);
        result.responseData = ('0x' + msg.slice(10).join(''));
    } else {
        result.attributeSize = Number('0x' + msg[8] + msg[9]);
        result.attributeType = '0x' + msg[10];
        result.attributeData = '0x' + msg.slice(11, -1).join('');
        result.status = '0x' + msg[msg.length - 1];
    }
    return result;
}

function handleReadAttributeResponse(msg) {
    console.log('read attribute response triggered');
    console.log('attribute resp handle: ' + msg.toString('hex'));

    var result = {};
    result.msgType = 'Read Attribute Report';
    result.sequenceNumber = ('0x' + msg[0]);
    result.shortAddress = ('0x' + msg[1] + msg[2]);
    result.endPoint = ('0x' + msg[3]);
    result.clusterID = ('0x' + msg[4] + msg[5]);
    result.attributeID = ('0x' + msg[6] + msg[7]);
    result.attributeStatus = ('0x' + msg[8]);
    result.attributeType = ('0x' + msg[9]);
    result.attributeSize = ('0x' + msg[10] + msg[11]);
    result.status = ('0x' + msg[12]);

    console.log(result);
    return result;
}

function handleStatusResponse(msg) {
    var statusList = ['Success', 'Incorrect parameters', 'Unhandled command',
        'Command failed', 'Busy', 'Stack already started', 'Failed'];
    var result = {};
    result.msgType = 'Status Response';
    var status = Number('0x' + msg[0]);
    result.responseStatus = statusList[status < 6 ? status : 6];
    result.sequenceNumber = ('0x' + msg[1]);
    result.packetType = ('0x' + msg[2] + msg[3]);
    return result;
}

function handleLogMessage(msg) {
    var logLevel = ['Emergency', 'Alert', 'Critical', 'Error', 'Warning',
        'Notice', 'Information', 'Debug'];
    var result = {};
    result.msgType = 'Log Message';
    result.logLevel = logLevel[Number('0x' + msg[0])];
    result.logMessage = stringifyMessage(msg.slice(1));
    return result;
}

function handleNodeCommandIDList(msg) {
    var result = {};
    result.msgType = 'Node Command ID List';
    result.sourceEndpoint = ('0x' + msg[0]);
    result.profileID = ('0x' + msg[1] + msg[2]);
    result.clusterID = ('0x' + msg[3] + msg[4]);
    result.commandIDList = getEntries(msg.slice(5), 1);
    return result;
}

function handleNodeClusterAttributeList(msg) {
    var result = {};
    result.msgType = 'Node Cluster Attribute List';
    result.sourceEndpoint = ('0x' + msg[0]);
    result.profileID = ('0x' + msg[1] + msg[2]);
    result.clusterID = ('0x' + msg[3] + msg[4]);
    result.attributeList = getEntries(msg.slice(5), 2);
    return result;
}

function handleNonFactoryNewReset(msg) {
    var statusList = ['STARTUP', 'WAIT_START', 'NFN_START', 'DISCOVERY',
        'NETWORK_INIT', 'RESCAN', 'RUNNING'];
    var result = {};
    result.msgType = 'Non "Factory New" Reset';
    result.status = statusList[Number('0x' + msg[0])];
    return result;
}

function handleNetworkJoinedOrFormed(msg) {
    var statusList = ['Joined existing network', 'Formed new network', 'Failed'];
    var result = {};
    result.msgType = 'Network Joined / Formed';
    var status = Number('0x' + msg[0]);
    result.status = statusList[status < 2 ? status : 2];
    result.shortAddress = ('0x' + msg[1] + msg[2]);
    result.IEEEAddress = ('0x' + msg.slice(3, 3 + 8).join(''));
    result.channel = ('0x' + msg[11]);
    return result;
}

function handleVersionList(msg) {
    var result = {};
    result.msgType = 'Version List';
    result.majorVersionNumber = ('0x' + msg[0] + msg[1]);
    result.installerVersionNumber = ('0x' + msg[2] + msg[3]);
    return result;
}

function handleDefaultResponse(msg) {
    var result = {};
    result.msgType = 'Default Response';
    result.sequenceNumber = ('0x' + msg[0]);
    result.endPoint = ('0x' + msg[1]);
    result.clusterID = ('0x' + msg[2] + msg[3]);
    result.commandID = ('0x' + msg[4]);
    result.statusCode = ('0x' + msg[5]);
    return result;
}

function handleLeaveIndication(msg) {
    var result = {};
    result.msgType = 'Leave Indication';
    result.IEEEAddress = ('0x' + msg.slice(0, 8).join(''));
    result.rejoinStatues = ('0x' + msg[8]);
    return result;
}

function handleDeviceAnnounce(msg) {
    var result = {};
    result.msgType = 'Device Announce';
    result.shortAddress = ('0x' + msg[0] + msg[1]);
    result.IEEEAddress = ('0x' + msg.slice(2, 2 + 8).join(''));
    result.macCapability = Number('0x' + msg[10]).toString(2);
    return result;
}

module.exports = {
    pack: pack,
    unpack: unpack,
    getEmitter: getEmitter
}
