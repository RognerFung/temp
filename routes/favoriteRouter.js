const express = require('express');
const bodyParser = require('body-parser');
const Favorites = require('../models/favorite');
const favoriteRouter = express.Router();
var authenticate = require('../authenticate');
const cors = require('./cors');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (favorites) {
            req.body.map(ele => ele._id).forEach(el => {
                if (favorites.dishes.indexOf(el) === -1) {
                    favorites.dishes.push(el);
                }
            });
            favorites.save()
            .then((fav) => {
                console.log('Favorites Updated');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err))
            .catch((err) => next(err));           
        } else {
            Favorites.create({
                user: req.user._id,
                dishes: req.body.map(ele => ele._id)
            })
            .then((fav) => {
                console.log('Favorites Created');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err)); 
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (favorites) {
            if (favorites.dishes.indexOf(req.params.dishId) === -1) {
                favorites.dishes.push(req.params.dishId);
            }
            favorites.save()
            .then((fav) => {
                console.log('Favorites Updated');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err))
            .catch((err) => next(err));           
        } else {
            Favorites.create({
                user: req.user._id,
                dishes: [req.params.dishId]
            })
            .then((fav) => {
                console.log('Favorites Created');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (favorites && favorites.dishes.indexOf(req.params.dishId) != -1) {
            const index = favorites.dishes.indexOf(req.params.dishId);
            favorites.dishes.splice(index, 1);
            favorites.save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        } else {
            res.statusCode = 403;
            res.end('No such dish in favorites');
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;