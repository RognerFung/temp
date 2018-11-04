var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var Car = require('../models/car');
var Bid = require('../models/bid');
var Favorite = require('../models/favorite');
var passport = require('passport');
var authenticate = require('../authenticate');
var adminRouter = express.Router();
const cors = require('./cors');
adminRouter.use(bodyParser.json());

adminRouter.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); } )

adminRouter.route('/users')
.get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    User.find(req.query)
    .then(users => {
        res.json({success: true, statusCode: 200, message: "Users have been found", result: users});
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    User.find(req.body)
    .then(users => {
        res.json({success: true, statusCode: 200, message: "Users have been found", result: users});
    }, err => next(err))
    .catch(err => next(err));
});

adminRouter.route('/cars')
.get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    Car.find(req.query)
    .populate('publisher', 'username')
    .populate('bids', '-car')
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: 'username'
        }
    })
    .then(cars => {
        res.json({success: true, statusCode: 200, message: "Cars have been found", result: cars});
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    Car.find(req.body)
    .populate('publisher', 'username')
    .populate('bids', '-car')
    .populate({
        path: 'bids',
        model: 'Bid',
        select: '-car',
        populate: {
            path: 'bidder',
            model: 'User',
            select: 'username'
        }
    })
    .then(cars => {
        res.json({success: true, statusCode: 200, message: "Cars have been found", result: cars});
    }, err => next(err))
    .catch(err => next(err));
});

adminRouter.route('/bids')
.get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    Bid.find(req.query)
    .populate('bidder', 'username')
    .populate('car', 'regNo model')
    .then(bids => {
        res.json({success: true, statusCode: 200, message: "Bids have been found", result: bids});
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    Bid.find(req.body)
    .populate('bidder', 'username')
    .populate('car', 'regNo model')
    .then(bids => {
        res.json({success: true, statusCode: 200, message: "Bids have been found", result: bids});
    }, err => next(err))
    .catch(err => next(err));
});

adminRouter.route('/users/:userId')
.get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    User.findById(req.params.userId)
    .then(user => {
        if (user == null) {
            res.json({success: false, statusCode: 404, message: "User " + req.params.userId + " has not been found"});
        } else {
            Favorite.findOne({user: user._id})
            .select('-user -_id')
            .populate('cars', 'regNo model')
            .then(favorite => {
                let userWithFav = Object.assign({}, user)._doc;
                userWithFav.favorite = favorite;
                res.json({success: true, statusCode: 200, message: "User " + req.params.userId + " has been found", result: userWithFav});
            }, err => next(err));
        }
    }, err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    User.findById(req.params.userId)
    .then(user => {
        if (req.body.isActive === undefined && req.body.isSeller === undefined && req.body.isBidder === undefined && req.body.isAdmin === undefined) {
            res.json({success: false, statusCode: 400, message: "Only isActive, isSeller, isBidder or isAdmin can be modified"});
        } else {
            if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
            if (req.body.isSeller !== undefined) user.isSeller = req.body.isSeller;
            if (req.body.isBidder !== undefined) user.isBidder = req.body.isBidder;
            if (req.body.isAdmin !== undefined) user.isAdmin = req.body.isAdmin;
            user.save()
            .then(user => {
                res.json({success: true, statusCode: 200, message: "The status of user " + req.params.userId + " has been modified", result: user});
            }, err => next(err));
        }
    }, err => next(err))
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) =>  {
    User.findOneAndRemove({_id: req.params.userId})
    .then(() => {
        res.json({success: true, statusCode: 200, message: "User " + req.params.userId + " has been deleted"});
    }, err => next(err))
    .catch(err => next(err));
});

// carRouter.route('/')
// .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Car.remove(req.query)
//     .then(() => {
//         res.json({success: true, statusCode: 200, message: "Cars have been deleted"});
//     }, err => next(err))
//     .catch(err => next(err));
// });

// carRouter.route('/:carId')
// .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Car.findOneAndUpdate(
//         {_id: req.params.carId},
//         {$set: req.body},
//         { new: true }
//     ).then(() => {
//         res.json({success: true, statusCode: 200, message: "Car " + req.params.carId + " has been updated"});
//     }, err => next(err))
//     .catch(err => next(err));
// })
// .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Car.findOneAndRemove({_id: req.params.carId})
//     .then(() => {
//         res.json({success: true, statusCode: 200, message: "Car " + req.params.carId + " has been deleted"});
//     }, err => next(err))
//     .catch(err => next(err));
// });

// carRouter.route('/:carId/bids')
// .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
//     Car.findById(req.params.carId)
//     .then(car => {
//         if (car == null) {
//             res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " has not been found"});
//         } else {
//             Bid.remove({car: req.params.carId})
//             .then(() => {
//                 car.bids = [];
//                 car.currentPrice = car.startingPrice;
//                 car.save()
//                 .then(() => {
//                     res.json({success: true, statusCode: 200, message: "All bids of car " + req.params.carId + " have been deleted"});                
//                 }, err => next(err));
//             }, err => next(err));            
//         }
//     }, err => next(err))
//     .catch(err => next(err));    
// });

module.exports = adminRouter;