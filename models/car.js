const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var carSchema = new Schema({
    regNo: {
        type: String,
        required: true,
        unique: true
    },
    model: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    yom: {
        type: Number,
        required: true
    },
    regDate: {
        type: Date,
        required: true
    },
    mileage: {
        type: Number,
        required: true
    },
    omv: {
        type: Number,
        required: true
    },
    arf: {
        type: Number,
        required: true
    },
    owners: {
        type: Number,
        required: true
    },
    paperValue: {
        type: Number,
        required: false
    },
    roadTaxExpireDate: {
        type: Date,
        required: true
    },
    remarks: String,
    images: [String],
    startingPrice: {
        type: Number,
        required: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    openTime: {
        type: Date,
        required: true
    },
    closeTime: {
        type: Date,
        required: true
    },
    isFeatured: {
        type: Boolean,
        default:false      
    },
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bids:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid'
    }]
}, {
    timestamps: true
}, {
    versionKey: false
});

var Car = mongoose.model('Car', carSchema);

module.exports = Car;