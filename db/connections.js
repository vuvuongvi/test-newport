const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/newport', {useNewUrlParser: true})
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