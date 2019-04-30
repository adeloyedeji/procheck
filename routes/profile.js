const router = require('express').Router();

const jwt = require('jsonwebtoken');

const User = require('../models/user');

const Profile = require('../models/profile');

const checkJWT = require('../middlewares/check-jwt');

router.route('/profile')
.get(checkJWT, (request, resp, next) => {
    Profile.findOne({ userId: request.decoded.user._id })
    .populate('user')
    .exec((err, profile) => {
        if(err) {
            resp.json({
                success: false,
                message: err,
            });
        } else {
            if(!profile) {
                resp.json({
                    success: false,
                    message: 'Oops! We couldn\'t find any match to this account. You\'re sure you have the right credentials?'
                })
            } else {
                resp.json({
                    succeess: true,
                    profile: profile,
                    message: 'success'
                })
            }
        }
    })
})
.post();

module.exports = router;