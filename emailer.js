var nodemailer = require('nodemailer');
var config = require('./config');

exports.emailer = (to, subject='', text, callback) => {
    var transporter = nodemailer.createTransport({
        host: config.email.host,
        secure: true,
        port: 465,
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }   
    });
    let message = {
        from: config.email.user,
        to: to,
        subject: subject,
        text: text
    };
    transporter.verify(function(error, success) {
        if (error) {
             console.log(error);
        } else {
             console.log('Server is ready to take our messages');
        }
    });
    transporter.sendMail(message, callback);
};