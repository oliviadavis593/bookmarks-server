const { API_TOKEN } = require('./config')
const logger = require('./logger')

//Auth. header validation middleware 
function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        return res.status(401).json({ error: `Unauthorized request` })
    }

    //move to next middleware 
    next()
}

module.exports = validateBearerToken 