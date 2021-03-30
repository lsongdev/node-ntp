'use strict';
const udp = require('dgram');
const util = require('util');
const Packet = require('./packet');
const EventEmitter = require('events');

/**
 * [NTPClient description]
 * @docs https://tools.ietf.org/html/rfc2030
 */
function NTP(options, callback) {
  if (!(this instanceof NTP))
    return new NTP(options, callback);
  EventEmitter.call(this);
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  Object.assign(this, {
    server: 'pool.ntp.org',
    port: 123
  }, options);
  this.socket = udp.createSocket('udp4');
  if (typeof callback === 'function')
    this.time(callback);
  return this;
};

util.inherits(NTP, EventEmitter);

/**
 * [time description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
NTP.time = function (options, callback) {
  return new NTP(options, callback);
};

/**
 * [time description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
NTP.prototype.time = function (callback) {
  const { server, port, timeout } = this;
  const packet = NTP.createPacket();
  this.socket.send(packet, 0, packet.length, port, server, err => {
    if (err) return callback(err);
    this.socket.once('message', data => {
      this.socket.close();
      const message = NTP.parse(data);
      callback(err, message);
    });
  });
  return this;
};

/**
 * [createPacket description]
 * @return {[type]} [description]
 */
NTP.createPacket = function () {
  const packet = new Packet();
  packet.mode = Packet.MODES.CLIENT;
  packet.originateTimestamp = Date.now();
  return packet.toBuffer();
};

/**
 * [parse description]
 * @param  {Function} callback [description]
 * @param  {[type]}   msg      [description]
 * @return {[type]}            [description]
 */
NTP.parse = function (buffer) {
  // const SEVENTY_YEARS = 2208988800;
  // var secsSince1900 = buffer.readUIntBE(40, 4);
  // var epoch = secsSince1900 - SEVENTY_YEARS;
  // var date = new Date(0);
  // date.setUTCSeconds(epoch);
  // return date;
  const message = Packet.parse(buffer);
  message.destinationTimestamp = Date.now();
  message.time = new Date(message.transmitTimestamp);
  // Timestamp Name          ID   When Generated
  // ------------------------------------------------------------
  // Originate Timestamp     T1   time request sent by client
  // Receive Timestamp       T2   time request received by server
  // Transmit Timestamp      T3   time reply sent by server
  // Destination Timestamp   T4   time reply received by client
  const T1 = message.originateTimestamp;
  const T2 = message.receiveTimestamp;
  const T3 = message.transmitTimestamp;
  const T4 = message.destinationTimestamp;
  // The roundtrip delay d and system clock offset t are defined as:
  // -
  // d = (T4 - T1) - (T3 - T2)     t = ((T2 - T1) + (T3 - T4)) / 2
  message.d = (T4 - T1) - (T3 - T2);
  message.t = ((T2 - T1) + (T3 - T4)) / 2;
  return message;
};

NTP.Client = NTP;
NTP.Server = require('./server');

/**
 * [createServer description]
 * @return {[type]} [description]
 */
NTP.createServer = function (options) {
  return new NTP.Server(options);
};

module.exports = NTP;
