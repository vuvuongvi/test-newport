const mongoose = require('../connections');
let P = mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema;
let taskToDoList = mongoose.model('task', new Schema({
        id: Number,
        name: String,
        command: String
    }
));
module.exports = taskToDoList;