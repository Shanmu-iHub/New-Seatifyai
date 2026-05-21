const fs = require('fs');
const b64 = require('./logoBase64.js').logoBase64;
const buffer = Buffer.from(b64, 'base64');
// WEBP dimensions are at specific offsets if it's a simple VP8X or VP8 chunk
console.log("Buffer length:", buffer.length);
