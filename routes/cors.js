const express = require('express');
const cors = require('cors');
const app = express();

const whitelist = ['http://localhost:3000', 'https://localhost:3443', 'http://localhost:4200'];
//const whitelist = ['http://139.199.89.130:9004', 'https://139.199.89.130:9447', 'http://139.199.89.130:9999'];
var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    //console.log(req.header('Origin'));
    if(whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true };
    }
    else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);