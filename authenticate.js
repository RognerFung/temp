var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey,
        {expiresIn: 36000});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        //console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    })
);

exports.verifyUser = passport.authenticate('jwt', {session: false});

exports.verifyAdmin = (req, res, next) => {
    if (req.user.isAdmin) {
        next();
    } else {
        var err = new Error ("You are not authorized to perform this");
        err.status = 403;
        return next(err);
    }
};

exports.verifySeller = (req, res, next) => {
    if (req.user.isSeller) {
        next();
    } else {
        var err = new Error ("You are not a seller");
        err.status = 403;
        return next(err);
    }
};

exports.verifyBidder = (req, res, next) => {
    if (req.user.isBidder) {
        next();
    } else {
        var err = new Error ("You are not authorized to bid");
        err.status = 403;
        return next(err);
    }
};

exports.facebookPassport = passport.use(
    new FacebookTokenStrategy(
        {
            clientID: config.facebook.clientId,
            clientSecret: config.facebook.clientSecret
        }, 
        (accessToken, refreshToken, profile, done) => {
            console.log(profile);
            User.findOne({facebookId: profile.id}, (err, user) => {
                if (err) {
                    console.log('111');
                    return done(err, false);
                }
                if (!err && user !== null) {
                    console.log('222');
                    return done(null, user);
                }
                else {
                    console.log('333');
                    user = new User({ username: profile.displayName });
                    user.facebookId = profile.id;
                    user.firstname = profile.name.givenName;
                    user.lastname = profile.name.familyName;
                    user.isActive = true;
                    if (profile.emails.length > 0) {
                        User.findOne({email: profile.emails[0].value})
                        .then((u, err) => {
                            if (err) {
                                console.log('email found err');
                            } else if (u == null) {
                                console.log('no email was found, create with facebook email');
                                user.email = profile.emails[0].value;
                                user.save((err, user) => {
                                    if (err)
                                        return done(err, false);
                                    else
                                        return done(null, user);
                                });
                            } else {
                                console.log('facebook email already exists in database, return existing user');
                                u.actCode = 'emailExist';
                                return done(null, u);
                            }
                        });
                    } else {
                        user.save((err, user) => {
                            if (err)
                                return done(err, false);
                            else
                                return done(null, user);
                        });
                    }
                }
            });
        }
    )
);