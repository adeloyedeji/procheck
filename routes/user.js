const router = require('express').Router();

const config = require('../config');

const User = require('../models/user');

const Profile = require('../models/profile');

const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');

const checkJWT = require('../middlewares/check-jwt');

router.post('/signup', (request, resp, next) => {
    let user        = new User();
    user.email      = request.body.email;
    user.fname      = request.body.fname;
    user.lname      = request.body.lname;
    user.username   = request.body.username;
    user.password   = request.body.password;
    avatar          = user.gravatar();

    User.findOne({ email: request.body.email, username: request.body.username }, (err, existingUser) => {
        if(err) {
            resp.json({
                success: false,
                message: err
            });
            return false;
        }
        if(existingUser) {
            resp.json({
                success: false,
                message: 'There seems to be an account with these details.'
            });
            return false;
        }
        user.save();

        let profile = new Profile();
        profile.userId = user._id;
        profile.save();

        jwt.sign({
            user: user
        }, config.secret, {
            expiresIn: '7d'
        });

        let mailOptions = {
            from:       'welcome@procheck.com',
            to:         user.email,
            subject:    'Welcome To ProCheck',
            text:       `Hi ${user.fname}, ${user.lname}. Your account was successfully created on ProCheck. Your Username: ${user.username}. Login in to your account using this link: ${config.client_host}/login`,
            html:       `<h3>Hi ${user.fname}, ${user.lname}.</h3><p>Your account was successfully created on ProCheck.</p><p>Username: ${user.username}</p><p>Wanna login? Click <a href='${config.client_host}/login'>here</a> to get started.</p>`
        }

        // config.transporter.sendMail(mailOptions, (err, info) => {
        //     if(err) {
        //         return console.log(err)
        //     }
        //     resp.json({
        //         success: true,
        //         message: 'Registration Successful.'
        //     });
        //     // console.log(`Message sent: ${info.messageId}`)
        //     // console.log(`Preview URL ${nodemailer.getTestMessageUrl(info)}`)
        // })
        return 1;
    });
});


router.post('/sign-in', (request, resp, next) => {
    User.findOne({ email: request.body.email }, (err, user) => {
        if(err) {
            throw err;
        }
        if(!user) {
            resp.json({
                success: false,
                message: 'Invalid account! User Not Found.'
            });
        } else {
            var validPassword = user.comparePassword(request.body.password);
            if(!validPassword) {
                resp.json({
                    success: false,
                    message: 'Authentication Failed! Did you forget your password?'
                });
            } else {
                var token = jwt.sign({
                    user: user
                }, config.secret, {
                    expiresIn: '7d'
                });

                user.updated = Date.now();
                user.save();

                Profile.findOne({ userId: user.id}, (err, existingProfile) => {
                    if(err) {
                        throw err;
                    }
                    if(!existingProfile) {
                        let profile = new Profile();
                        profile.userId = user.id;
                        profile.status = 1;
                        profile.save();
                    } else {
                        existingProfile.status = 1;
                        existingProfile.updated = Date.now();
                        existingProfile.save();
                    }
                });

                resp.json({
                    success: true,
                    token: token,
                    message: `Login Successfull. Welcome ${user.fname}`
                });
            }
        }
    });
});

router.post('/verify', [checkJWT], (request, response, next) => {
    response.json({
        status: true,
        message: 'logged-in'
    });
});

module.exports = router;