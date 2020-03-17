const mongoose = require('mongoose');
const path = require('path')
require('dotenv').config({path:path.resolve(__dirname, '../.env')})
mongoose.connect(process.env.DB_PRODUCTION, {useNewUrlParser: true})
    .catch(error => {
        throw error;
    });
mongoose.connection.on('connected', function() {
    console.log("Mongoose default connected ");
});
mongoose.connection.on('disconnected', function () {
    console.log("Mongoose default disconnected ");
});
mongoose.connection.on('error', function(err){
    console.log(`Mongoose connection error: ${err}`);
});
module.exports = mongoose;