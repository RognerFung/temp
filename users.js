var express = require('express');
var bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
var router = express.Router();
var cors = require('./cors');
var emailer = require('../emailer');
var makeCode = require('../public/javascripts/actCode');
var config = require('../config.js');
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); } )

router.route('/signup')
.post(cors.corsWithOptions, (req, res, next) => {
    let activation_code = makeCode.makeCode();
    User.register(
        new User({username: req.body.username, email: req.body.email, actCode: activation_code}),
        req.body.password,
        (err, user) => {
            if (err) {
                return next(err);
            } else {
                emailer.emailer(
                    user.email,
                    'Welcome to biddit',
                    'Thank you for signing in! Click <a href="' + config.weburl + 'users/activation?id=' + user._id + '&actCode=' + user.actCode + '"></a> to activate',
                    () => {
                        passport.authenticate('local')(req, res, () => {
                            res.json({success: true, statusCode: 200, message: 'Thank you for signing up!'});
                        });
                    }
                ); 
            }
        }
    );
});

router.route('/test')
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>  {
    User.findById(req.user._id)
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.user._id + " not found"});
        } else {
            let act_url = '<a href="' + config.weburl + 'users/activation?id=' + user._id + '&actCode=' + user.actCode + '"></a>';
            emailer.emailer(user.email, 'Welcome to car auction', 'Thank you for signing in! Click ' + act_url + ' to activate',
                () => {
                    console.log("A email has been sent");
                    res.json({success: true, statusCode: 200, message: "An activation email has been sent to you"});
                }
            );
        }
    }, err => next(err))
    .catch(err => next(err));
});

router.route('/activation')
.get(cors.corsWithOptions, (req, res, next) => {
    User.findById(req.query.id)
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.user._id + " not found"});
        } else if (user.isActive) {
            res.json({success: false, statusCode: 400, message: "User " + req.user._id + " doesn't need to be activated"});
        } else if (user.actCode != req.query.actCode) {
            res.json({success: false, statusCode: 400, message: "Activation code was incorrect"});
        } else {
            user.isActive = true;
            user.actCode = '';
            user.save()
            .then(() => {
                res.json({success: true, statusCode: 200, message: "Activation complete"}); 
            }, (err) => next(err));
        }
    }, err => next(err))
    .catch(err => next(err));
});

router.route('/login')
.post(cors.corsWithOptions, passport.authenticate('local'), (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else if (user == null) {
            res.json({success: false, statusCode: 404, message: "User has not been found"});
        } else {
            req.logIn(user, err => {
                if (err) {
                    res.json({success: false, statusCode: 400, message: "Login fail"});
                } else {
                    let token = authenticate.getToken({_id: req.user._id});
                    res.json({success: true, statusCode: 200, message: "Welcome " + user.username, token: token});
                }
            });
        } 
    }) (req, res, next);
});

//can't destroy token in the server side, so to really logout must destroy token in the client side 
router.route('/logout')
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    console.log(req.session);
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.json({success: true, statusCode: 200, message: "You have logged out"});
    } else {
        res.json({success: false, statusCode: 400, message: "You have not logged in yet"});
    }
});

router.route('/userInfo')
.post(authenticate.verifyUser, cors.corsWithOptions, (req, res, next) => {
    User.findById(req.user._id)
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.user._id + " has not been found"});
        } else {
            if (req.body.firstname)
                user.firstname = req.body.firstname;
            if (req.body.lastname)
                user.lastname = req.body.lastname;
            if (req.body.tel)
                user.tel = req.body.tel;
            user.save()
            .then(() => {
                res.json({success: true, statusCode: 200, message: "User info has been updated"});
            }, (err) => next(err));    
        }
    }, err => next(err))
    .catch(err => next(err));
});

router.route('/changePassword')
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findOne({_id: req.user._id})
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.user._id + " has not been found"});
        } else {
            user.changePassword(req.body.oldPassword, req.body.newPassword)
            .then(() => {
                res.json({success: true, statusCode: 200, message: "Password has been changed"});
            }, err => next(err));
        }
    }, err => next(err))
    .catch(err => next(err));
});

router.route('/retrievePassword')
.post(cors.corsWithOptions, (req, res, next) => {
    if (req.body.username == null && req.body.email == null) {
        res.json({success: false, statusCode: 400, message: "Need username or email address to retrieve password"});
    } else {
        let query = null;
        if (req.body.username) {
            query = {username: req.body.username};
        } else if (req.body.email) {
            query = {email: req.body.email};
        }
        User.findOne(query)
        .then(user => {
            if (user == null) {
                res.json({success: false, statusCode: 404, message: "User " + req.user._id + " has not been found"});
            } else {
                let activation_code = makeCode.makeCode();
                let act_url = '<a href="' + config.weburl + 'users/resetPassword?id=' + user._id + '&actCode=' + activation_code + '"></a>';    
                user.actCode = activation_code;
                user.save()
                .then(() => {
                    emailer.emailer(user.email, 'Retrieve Your Password', 'To reset your password, click ' + act_url, () => {
                        console.log("A email has been sent");
                        res.json({success: true, statusCode: 200, message: "An email to retrieve your password has been sent to you"}); 
                    }); 
                }, err => next(err));   
            }
        }, err => next(err))
        .catch(err => next(err));
    }
});

router.route('/resetPassword')
.get(cors.corsWithOptions, (req, res, next) => {
    User.findById(req.query.id)
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.query.id + " has not been found"});
        } else if (user.actCode != req.query.actCode) {
            res.json({success: false, statusCode: 400, message: "Activation code was incorrect"});
        } else {
            user.isActive = false;
            user.save()
            .then(() => {
                var token = authenticate.getToken({_id: user._id});
                res.json({success: true, statusCode: 200, message: "Ready to reset password", token: token});
            }, err => next(err)); 
        }
    }, err => next(err))
    .catch(err => next(err));
});

router.route('/resetPassword')
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user._id)
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.user._id + " has not been found"});
        } else if (req.body.password == null) {
            res.json({success: false, statusCode: 400, message: "No password provided"});
        } else {
            user.setPassword(req.body.password, err => {
                if (err) {
                    return next(err);
                } else {
                    user.isActive = true;
                    user.actCode = '';
                    user.save()
                    .then(() => {
                        res.json({success: true, statusCode: 200, message: "Password has been reseted"});
                    }, err => next(err));
                }
            });
        }
    }, err => next(err))
    .catch(err => next(err));
});

router.route('/facebook/token')
.get(passport.authenticate('facebook-token'), (req, res) => {
    if (req.user) {
        var token = authenticate.getToken({_id: req.user._id});
        res.json({success: true, token: token, statusCode: 200, message: 'You have logged in through Facebook'});
    } else {
        res.json({success: false, statusCode: 400, message: 'Login through Facebook has failed'});
    }
});

router.get('/checkJWTToken', cors.corsWithOptions, (req, res) => {
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.json({success: false, statusCode: 401, message: "JWT invalid!"});
        }
        else {
            return res.json({success: true, statusCode: 200, message: 'JWT valid!'});
        }
    }) (req, res);
});

module.exports = router;
