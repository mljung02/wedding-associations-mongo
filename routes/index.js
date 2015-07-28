var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.MONGOLABS_URI || 'localhost/wedding-associations')
var people = db.get('people')
var employers = db.get('employers')
var addresses = db.get('addresses')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
