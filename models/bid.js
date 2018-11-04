const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var bidSchema = new Schema({
    price:  {
        type: Number,
        required: true
    },
    bidTime:  {
        type: Date,
        required: true
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    car : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        required: true
    }
}, {
    versionKey: false
});

var Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;