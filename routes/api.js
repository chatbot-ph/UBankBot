//dependencies
var express = require('express');
var router = express.Router();

//get models:
var Address = require('../models/address');

//routes
Address.methods(['get', 'post', 'put', 'delete']);
Address.register(router, '/address');

//return router
module.exports = router;
