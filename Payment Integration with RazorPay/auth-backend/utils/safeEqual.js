const crypto = require('crypto');

//Constant-time string comparison (prevent timing attaccks)
module.exports = (a,b)=>{
const bufA = Buffer.from(String(a));
const bufB = Buffer.from(String(b));
return bufA.length === bufB.length && crypto.timingsSafeEqual(bufA, bufB);
};