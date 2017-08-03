'use strict';

var LEFT_EP_SWITCH = 0x01;
var RIGHT_EP_SWITCH = 0x02;
var LEFT_EP_SOCKET = 0x02;
var RIGHT_EP_SOCKET = 0x03;

function Relation(option) {

  this.name = option.name || 'emptyName';
  this.emitterShort = option.emitterShort || '0x0000'; // emitter short address
  this.receiverShort = option.receiverShort || '0x0000'; // receiver short address
  this.eEP = option.eEP || LEFT_EP_SWITCH; // emitter end point
  this.rEP = option.rEP || LEFT_EP_SOCKET; // receiver end point

}

module.exports = {
  Relation: Relation,
  LEFT_EP_SWITCH: LEFT_EP_SWITCH,
  RIGHT_EP_SWITCH: RIGHT_EP_SWITCH,
  LEFT_EP_SOCKET: LEFT_EP_SOCKET,
  RIGHT_EP_SOCKET: RIGHT_EP_SOCKET
}
