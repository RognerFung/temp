const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var favoriteSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cars:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    }]
}, {
    versionKey: false
});

var Favorite = mongoose.model('Favorites', favoriteSchema);

module.exports = Favorite;