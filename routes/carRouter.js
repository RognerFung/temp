var express = require('express');
var bodyParser = require('body-parser');
var Car = require('../models/car');
var Bid = require('../models/bid');
var carRouter = express.Router();
var authenticate = require('../authenticate');
var cors = require('./cors');

carRouter.use(bodyParser.json());

carRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Car.find(req.query)
    .select('-createdAt -updatedAt -isFeatured')
    .populate('publisher', 'username email tel -_id')
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: 'username email tel -_id'
        }
    })
    .then(cars => {
        res.json({success: true, statusCode: 200, message: "Cars have been found", result: cars});
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifySeller, (req, res, next) => {
    req.body.bids = [];
    req.body.publisher = req.user._id;
    req.body.openTime = new Date();
    let days = req.body.days ? req.body.days : 30;
    let currentTime = new Date();
    req.body.closeTime = currentTime.setDate(currentTime.getDate() + days);
    req.body.currentPrice = req.body.startingPrice;
    Car.create(req.body)
    .then(() => {
        res.json({success: true, statusCode: 200, message: "The car has been published"});
    }, err => next(err))
    .catch(err => next(err));
})

carRouter.route('/:carId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Car.findById(req.params.carId)
    .select('-createdAt -updatedAt -isFeatured')
    .populate('publisher', 'username email tel -_id')
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: 'username email tel -_id'
        }
    })
    .then(car => {
        res.json({success: true, statusCode: 200, message: "Car " + req.params.carId + " has been found", result: car});
    }, err => next(err))
    .catch(err => next(err));
})

carRouter.route('/:carId/bids')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Car.findById(req.params.carId)
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: 'username email tel -_id'
        }
    })
    .then(car => {
        if (car == null) {
            res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " has not been found"});
        }
        else {
            res.json({success: true, statusCode: 200, message: "Bids have been found", result: car.bids});
        }
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyBidder, (req, res, next) => {
    Car.findById(req.params.carId)
    .populate({
        path: 'bids',
        model: 'Bid'
    })
    .then(car => {
        if (car == null) {
            res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " has not been found" });
        } else if (car.publisher.equals(req.user._id)) {
            res.json({success: false, statusCode: 400, message: "Can't bid on your own car" });
        } else if (req.body.price <= car.currentPrice) {
            res.json({success: false, statusCode: 400, message: "Illegal bidding price" });
        } else if (car.bids.length > 0 && car.bids[car.bids.length - 1].bidder.equals(req.user._id)) {
            res.json({success: false, statusCode: 400, message: "You already have the highest bid" });
        } else {
            Bid.create({
                car: car._id,
                bidder: req.user._id,
                bidTime: new Date(),
                price: req.body.price
            })
            .then(bid => {
                car.currentPrice = req.body.price;
                car.bids.push(bid._id);
                car.save()
                .then(() => {
                    res.json({success: true, statusCode: 200, message: "Bid has been made"});           
                }, err => next(err));
            }, err => next(err));
        }        
    }, err => next(err))
    .catch(err => next(err));
})

carRouter.route('/:carId/bids/:bidId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Car.findById(req.params.carId)
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: 'username email tel -_id'
        }
    })
    .then(car => {
        if (car == null) {
            res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " has not been found"});
        } else if (car.bids.find(ele => ele._id.equals(req.params.bidId)) == null) {
            res.json({success: false, statusCode: 404, message: "Bid " + req.params.bidId + " has not been found"});
        } else {
            res.json({success: true, statusCode: 200, message: "Bid " + req.params.bidId + " has been found", result: car.bids.find(ele => ele._id.equals(req.params.bidId))});    
        }
    }, err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyBidder, (req, res, next) => {
    Car.findById(req.params.carId)
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: '_id'
        }
    })
    .then(car => {
        if (car == null) {
            res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " has not been found"});
        } else if (car.bids.find(ele => ele._id.equals(req.params.bidId)) == null) {
            res.json({success: false, statusCode: 404, message: "Bid " + req.params.bidId + " has not been found"});
        } else if (!req.user._id.equals(car.bids.find(ele => ele._id.equals(req.params.bidId)).bidder._id)) {
            res.json({success: false, statusCode: 400, message: "You are not authorized to modify this bid"});
        } else if (car.bids.indexOf(car.bids.find(ele => ele._id.equals(req.params.bidId))) !== (car.bids.length - 1)) {
            res.json({success: false, statusCode: 400, message: "Only the current bid can be modified"});
        } else if (req.body.price === car.bids.find(ele => ele._id.equals(req.params.bidId)).price) {
            res.json({success: false, statusCode: 400, message: "Same price, nothing to modified"});
        } else {
            const last_high_price = car.bids.length > 1 ? car.bids[car.bids.length - 2].price : car.startingPrice;
            if (req.body.price <= last_high_price) {
                res.json({success: false, statusCode: 400, message: "Illegal bidding price"});
            } else {
                Bid.findByIdAndUpdate(
                    req.params.bidId,
                    {
                        bidTime: new Date(),
                        price: req.body.price
                    },
                    { new: true }
                ).then(bid => {
                    car.currentPrice = bid.price;
                    car.save()
                    .then(() => {
                        res.json({success: true, statusCode: 200, message: "Bid " + req.params.bidId + " has been modified"});  
                    }, err => next(err));
                }, err => next(err));
            }
        }
    }, err => next(err))
    .catch(err => next(err));
});

module.exports = carRouter;