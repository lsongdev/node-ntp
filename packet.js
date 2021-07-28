const assert = require('assert');
/**
                      1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|LI | VN  |Mode |    Stratum    |     Poll      |   Precision   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                          Root Delay                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Root Dispersion                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Reference Identifier                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                   Reference Timestamp (64)                    |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                   Originate Timestamp (64)                    |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                    Receive Timestamp (64)                     |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                    Transmit Timestamp (64)                    |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Key Identifier (optional) (32)                |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                                                               |
|                 Message Digest (optional) (128)               |
|                                                               |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

/**
 * 1900 ~ 1970
 * @docs https://tools.ietf.org/html/rfc4330#section-3
 */
const SEVENTY_YEARS = 2208988800;

/**
 * @rfc https://tools.ietf.org/html/rfc4330
 */
class Packet {
  constructor(){
    Object.assign(this, {
      leapIndicator: 0,
      version: 4,
      mode: 3,
      stratum: 0,
      pollInterval: 6,
      precision: 236,
      referenceIdentifier: Buffer.from([0, 0, 0, 0]),
      referenceTimestamp: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      originateTimestamp: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      receiveTimestamp: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      transmitTimestamp: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
    });
  }
  static parse(buffer) {
    assert.equal(buffer.length, 48, 'Invalid Package');
    const packet = new Packet();
    packet.leapIndicator       = (buffer[0] >> 6);
    packet.version             = (buffer[0] & 0x38) >> 3;
    packet.mode                = (buffer[0] & 0x7);
    packet.stratum             = buffer[1];
    packet.pollInterval        = buffer[2];
    packet.precision           = buffer[3];
    packet.rootDelay           = buffer.slice(4, 8);
    packet.rootDispersion      = buffer.slice(8, 12);
    packet.referenceIdentifier = buffer.slice(12, 16);
    packet.referenceTimestamp  = buffer.slice(16, 24);
    packet.originateTimestamp  = buffer.slice(24, 32);
    packet.receiveTimestamp    = buffer.slice(32, 40);
    packet.transmitTimestamp   = buffer.slice(40, 48)
    return packet;
  }
  toBuffer() {
    const buffer = Buffer.alloc(48).fill(0x00);
    buffer[0] = 0; // 0b11100011; // LI, Version, Mode
    buffer[0] += this.leapIndicator << 6;
    buffer[0] += this.version << 3;
    buffer[0] += this.mode << 0;
    buffer[1] = this.stratum;
    buffer[2] = this.pollInterval;
    buffer[3] = this.precision;
    buffer.writeUInt32BE(this.rootDelay, 4);
    buffer.writeUInt32BE(this.rootDispersion, 8);
    buffer.writeUInt32BE(this.referenceIdentifier, 12);
    this.referenceTimestamp.copy(buffer, 16, 0, 8);
    this.originateTimestamp.copy(buffer, 24, 0, 8);
    this.receiveTimestamp.copy(buffer, 32, 0, 8);
    this.transmitTimestamp.copy(buffer, 40, 0, 8);
    return buffer;
  }
  toJSON() {
    const output = Object.assign({}, this);
    const { leapIndicator, version } = this;
    output.version = version;
    output.leapIndicator = {
      0: 'no-warning',
      1: 'last-minute-61',
      2: 'last-minute-59',
      3: 'alarm'
    }[leapIndicator];
    const { mode } = this;
    switch (mode) {
      case 1: output.mode = 'symmetric-active'; break;
      case 2: output.mode = 'symmetric-passive'; break;
      case 3: output.mode = 'client'; break;
      case 4: output.mode = 'server'; break;
      case 5: output.mode = 'broadcast'; break;
      case 0:
      case 6:
      case 7: output.mode = 'reserved'; break;
    }
    const { stratum } = this;
    if (stratum === 0) {
      output.stratum = 'death';
    } else if (stratum === 1) {
      output.stratum = 'primary';
    } else if (stratum <= 15) {
      output.stratum = 'secondary';
    } else {
      output.stratum = 'reserved';
    }
    output.referenceTimestamp = new Date(toMsecs(this.referenceTimestamp));
    output.originateTimestamp = new Date(toMsecs(this.originateTimestamp));
    output.receiveTimestamp = new Date(toMsecs(this.receiveTimestamp));
    output.transmitTimestamp = new Date(toMsecs(this.transmitTimestamp));
    return output;
  }

// 1                   2                   3
// 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                           Seconds                             |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                  Seconds Fraction (0-padded)                  |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

  toMsecs(buffer) {
    let seconds = 0;
    let fraction = 0;
    for (let i = 0; i < 4; ++i) {
      seconds = (seconds * 256) + buffer[i];
    }
    for (let i = 4; i < 8; ++i) {
      fraction = (fraction * 256) + buffer[i];
    }
    return ((seconds - SEVENTY_YEARS + (fraction / Math.pow(2, 32))) * 1000);
  }
  writeMsecs(buffer, ts){
    // const buffer = Buffer.alloc(8); // 64bits
    const seconds = Math.floor(ts / 1000) + SEVENTY_YEARS;
    const fraction = Math.round((ts % 1000) / 1000 * Math.pow(2, 32));
    // seconds
    buffer[0] = (seconds & 0xFF000000) >> 24;
    buffer[1] = (seconds & 0x00FF0000) >> 16;
    buffer[2] = (seconds & 0x0000FF00) >> 8;
    buffer[3] = (seconds & 0x000000FF);
    // fraction
    buffer[4] = (fraction & 0xFF000000) >> 24;
    buffer[5] = (fraction & 0x00FF0000) >> 16;
    buffer[6] = (fraction & 0x0000FF00) >> 8;
    buffer[7] = (fraction & 0x000000FF);
    return buffer;
  }
}

// Mode     Meaning
// ------------------------------------
// 0        reserved
// 1        symmetric active
// 2        symmetric passive
// 3        client
// 4        server
// 5        broadcast
// 6        reserved for NTP control message
// 7        reserved for private use
Packet.MODES = {
  CLIENT: 3,
  SERVER: 4,
};;

module.exports = Packet;