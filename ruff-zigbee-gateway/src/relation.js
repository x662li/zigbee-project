'use strict';


function Relation(option){
  this.name = option.name || 'emptyName';
  this.emitterShort = option.emitterShort || '0x0000';
  this.receiverShort = option.receiverShort || '0x0000';
}

module.exports = {
  Relation: Relation
}
