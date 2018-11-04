var express = require('express');
var bodyParser = require('body-parser');
var Favorite = require('../models/favorite');
var Bid = require('../models/bid');
var favoriteRouter = express.Router();
var authenticate = require('../authenticate');
var cors = require('./cors');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .populate('user', 'username email tel -_id')
    .populate({
        path: 'cars',
        populate: {
            path: 'publisher',
            model: 'User',
            select: 'username email tel -_id'
        }
    })
    .populate({
        path: 'cars',
        select: '-createdAt -updatedAt -isFeatured',
        populate: {
            path: 'bids',
            model: 'Bid',
            populate: {
                path: 'bidder',
                model: 'User',
                select: 'username email tel -_id'
            }
        } 
    })
    .then(favorites => {
        if (favorites == null) {
            res.json({success: true, statusCode: 200, message: "You don't have any favorites", result: []});
        } else {
            res.json({success: true, statusCode: 200, message: "Favorites has been found", result: favorites});
        }
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites) {
            req.body.map(ele => ele._id).forEach(el => {
                if (favorites.cars.indexOf(el) === -1) {
                    favorites.cars.push(el);
                }
            });
            favorites.save()
            .then(() => {
                res.json({success: true, statusCode: 200, message: "Favorites has been updated"});
            }, err => next(err));           
        } else {
            Favorite.create({
                user: req.user._id,
                cars: req.body.map(ele => ele._id)
            })
            .then(() => {
                res.json({success: true, statusCode: 200, message: "Favorites has been created"});
            }, err => next(err));
        }
    }, err => next(err))
    .catch(err => next(err));    
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({user: req.user._id})
    .then(favorites => {
        if (favorites) {
            res.json({success: true, statusCode: 200, message: "Favorites has been deleted"});
        } else {
            res.json({success: false, statusCode: 404, message: "You don't have any favorites"});
        }
    }, err => next(err))
    .catch(err => next(err)); 
});

favoriteRouter.route('/:carId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites == null) {
            res.json({success: false, statusCode: 404, message: "You don't have any favorites"});
        } else {
            if (favorites.cars.indexOf(req.params.carId) < 0) {
                res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " doesn't exist in your favorites"});
            } else {
                res.json({success: true, statusCode: 200, message: "Car has been found in your favorites"});
            }
        }
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites) {
            if (favorites.cars.indexOf(req.params.carId) < 0) {
                favorites.cars.push(req.params.carId);
                favorites.save()
                .then(() => {
                    res.json({success: true, statusCode: 200, message: "Car " + req.params.carId + " has been added in your favorites"});
                }, err => next(err));                 
            } else {
                res.json({success: false, statusCode: 400, message: "Car " + req.params.carId + " is already in your favorites"});
            }      
        } else {
            Favorite.create({
                user: req.user._id,
                cars: [req.params.carId]
            })
            .then(() => {
                res.json({success: true, statusCode: 200, message: "Favorites created. Car " + req.params.carId + " has been added in your favorites"});
            }, err => next(err));
        }
    }, err => next(err))
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites == null) {
            res.json({success: false, statusCode: 404, message: "You don't have any favorites"});
        } else if (favorites.cars.indexOf(req.params.carId) < 0) {
            res.json({success: false, statusCode: 404, message: "Car " + req.params.carId + " doesn't exist in your favorites"});  
        } else {
            favorites.cars.splice(favorites.cars.indexOf(req.params.carId), 1);
            if (favorites.cars.length === 0) {
                Favorite.findOneAndDelete({user: req.user._id})
                .then(() => {
                    res.json({success: true, statusCode: 200, message: "Car " + req.params.carId + " has been deleted. You don't have any favorites"});
                }, err => next(err));
            } else {
                favorites.save()
                .then(() => {
                    res.json({success: true, statusCode: 200, message: "Car " + req.params.carId + " has been deleted"});
                }, err => next(err));
            }
        }       
    }, err => next(err))
    .catch(err => next(err));
});

module.exports = favoriteRouter;