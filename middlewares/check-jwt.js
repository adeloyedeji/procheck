const jwt = require('jsonwebtoken');

const config = require('../config');

module.exports = function(request, response, next) {
    let token = request.headers['authorization'];

    if(token) {
        jwt.verify(token, config.secret, function(err, decoded) {
            if(err) {
                response.json({
                    success: false,
                    message: 'Well your session is expired. Kindly sign in to continue.'
                })
            } else {
                request.decoded = decoded
                next()
            }
        })
    } else {
        response.status(403).json({
            success: false,
            message: 'No session found! You need to sign in to continue.'
        })
    }
}