const rateLimit = require('express-rate-limit');

const limit = rateLimit({
    windowMs: 5*60*1000 , // 300000 milli seconds
    limit: 50,
    message: "Too many requests. Please try again later.",
    standardHeaders: 'draft-7',
    legacyHeaders: false,
})
module.exports = { limit } ;