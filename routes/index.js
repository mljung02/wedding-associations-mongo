var express = require('express');
var router = express.Router();
var calls = require('../lib/calls')

/* GET home page. */



router.get('/', function(req, res, next) {
  res.redirect('/guests');
});

router.get('/guests/new', function (req, res, next) {
  calls.getSongs().then(function (songs) {
    res.render('guests/new', {songs: songs})
  })  
})

router.get('/guests/:id/edit', function (req, res, next) {
  calls.getGuest(req.params.id).
  then(calls.addSongsToGuest).
  then(calls.fillServices).
  then(function (guest) {
    res.render('guests/edit', {guest: guest})
  })
})

router.get('/guests', function (req, res, next) {
  calls.getGuests().then(function (guests) {
    res.render('index', {guests: guests})
  })
})

router.get('/guests/:id', function (req, res, next) {
  calls.getGuest(req.params.id).
  then(calls.addSongsToGuest).
  then(calls.prettyServices).
  then(function (guest) {
    res.render('guests/show', {guest: guest})
  })
})

router.post('/guests', function (req, res, next) {
  var person = calls.personRender(req.body)
  calls.addPerson(person).
  then(calls.addServices(req.body)).
  then(calls.addServicesToPerson).
  then(function (guest) {
    calls.addSongs(req.body.songs, guest._id)
  }).
  then(function () {
    res.redirect('/guests')
  })
})

router.post('/guests/:id', function (req, res, next) {
  console.log(req.body, 'in Edit right?')
  var person = calls.personRender(req.body)
  calls.updatePerson(person, req.params.id).then(function (yo) {
    console.log(yo, 'PERSON UPDATED!!!!!!!!!!!!!!!!!!!!')
  }).
  then(calls.addServices(req.body)).
  then(calls.addServicesToPerson).
  then(function (guest) {
    calls.addSongs(req.body.songs, guest._id)
  }).
  then(function () {
    res.redirect('/guests')
  })
})

module.exports = router;

