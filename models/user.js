var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    tel: {
        type: String,
        default: ''
    },
    facebookId: String,
    isAdmin:   {
        type: Boolean,
        default: false
    },
    isSeller: {
        type: Boolean,
        default: false
    },
    isBidder: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    actCode: {
        type: String,
        default: ''
    }
}, {
    versionKey: false
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);