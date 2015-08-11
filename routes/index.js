var express = require('express');
var router = express.Router();
var calls = require('../lib/calls')
require('dotenv').load()
var db = require('monk')(process.env.MONGOLABS_URI)

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
    console.log(guest)
    res.render('guests/show', {guest: guest})
  })
})

router.post('/guests', function (req, res, next) {
  var person = calls.personRender(req.body)
  calls.addPerson(person).
  then(calls.addServices(req.body)).
  then(calls.addServicesToPerson).
  then(function (guest) {
    console.log('adding songs', guest)
    calls.addSongs(req.body.songs, guest._id)
    return guest
  }).
  then(function (guest) {
    console.log('render time', guest)
    res.redirect('/guests/'+guest._id)
  })
})

router.post('/guests/rsvps', function (req, res, next) {
  calls.rsvpUpdate(req.body.rsvps).then(function () {
    res.redirect('/guests')
  })
})

router.post('/guests/:id', function (req, res, next) {
  console.log(req.body, 'in Edit right?')
  var person = calls.personRender(req.body)
  calls.updatePerson(person, req.params.id).
  then(calls.addServices(req.body, person)).
  then(calls.addServicesToPerson).
  then(function (guest) {
    calls.addSongs(req.body.songs, guest._id)
  }).
  then(function () {
    res.redirect('/guests/'+req.params.id)
  })
})

router.get('/songs/:id/delete/:gId', function (req, res, next) {
  calls.removeSong(req.params.id).then(function () {
    res.redirect('/guests/'+req.params.gId)
  })
})

router.get('/guests/:id/delete', function (req, res, next) {
  calls.removeGuest(req.params.id).then(function () {
    res.redirect('/guests')
  })
})



module.exports = router;

