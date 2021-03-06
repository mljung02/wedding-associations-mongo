require('dotenv').load()
var db = require('monk')(process.env.MONGOLAB_URI)
var guests = db.get('guests')
var services = db.get('services')
var songCollection = db.get('songs')
var express = require('express');


var calls = {
  addPerson: function(person){
    return guests.insert(person)
  },
  
  updatePerson: function (person, id) {
    console.log("UPDATING PERSON", person, id)
    return new Promise(function (success) {
      guests.update({_id: id}, person).then(function () {
        console.log('updated', id)
        return guests.findOne({_id: id})
        }).then(function (guest) {
          console.log('updated and found', guest)
          success(guest)
      })
    })
  },
  
  addSongs: function (songs, submitter) {
    songs = songs.split('\n')
    console.log(songs, 'IN ADD SONGS')
    songs.filter(function (song) {
      if (song.trim().length > 0) {
        return true
      }
    })
    songs = songs.map(function (song) {
      var temp = song.replace('\r', '')
      return temp.replace('\r', '')
    })
    console.log(songs, 'after replace')
    songCollection.find({name: {$in: songs}}).then(function (songArray) {
      songs = songs.filter(function (song, i) {
        for (var i = 0; i < songArray.length; i++) {
          console.log(songArray[i].name === song, songArray[i].submitter.toString() === submitter.toString())
          if (songArray[i].name === song && songArray[i].submitter.toString() === submitter.toString()) {
            console.log('match!')
            return false;
          }
        }
        return true;
      })
      console.log(songs, 'after splice')
      songs = songs.map(function (song) {
        var temp = {}
        if (song.trim() !== '') {
          temp.name = song;
          temp.submitter = submitter;
          return temp;
        }
      })
      console.log(songs, 'song array', songs.length)
      if (songs[0] && songs.length > 0) {
        songCollection.insert(songs)
      }
    })
  },
  
  getSongs: function () {
    return songCollection.find({})
  },
  
  getGuests: function(){
    return guests.find({})
  },
  
  getGuest: function(id){
    return guests.findOne({_id: id})
  },
  
  addSongsToGuest: function (guest) {
    return new Promise(function (success) {
      songCollection.find({submitter: guest._id}).then(function (songs) {
        guest.songs = songs;
        var songArray = [];
        songs.forEach(function (song) {
          songArray.push(song.name)
        })  
        var songNames = songArray.join('\n')
        guest.songNames = songNames
        console.log('songs guest', guest)
        success(guest);
      })
    })
  },
  
  fillServices: function (guest) {
    console.log(guest, 'in fill')
    return new Promise(function (success) {
      services.find({}).then(function (services) {
        var serviceKey = {}
        services.forEach(function (service) {
          serviceKey[service._id] = service.name;
        })
        console.log('asdfasdf', serviceKey)
        guest.services = guest.services.map(function (service) {
          console.log(service)
          return serviceKey[service]
        })
        guest.services.forEach(function (service) {
          guest[service] = true
        })
        console.log('success guest', guest)
        success(guest)
      })
    })
  },
  
  prettyServices: function (guest) {
    return new Promise(function (success) {
      services.find({}).then(function (services) {
        var serviceKey = {}
        services.forEach(function (service) {
          serviceKey[service._id] = service.name;
        })
        guest.services = guest.services.map(function (service) {
          service = serviceKey[service]
          service = capitalizeFirstLetter(service);
          if(service === 'GluetenFree') {
            service = 'Glueten Free'
          }
          if (service === 'welcome') {
            service = 'Welcome Dinner'
          }
          return service
        })
      success(guest)
      })
    })
  },
  
  personRender: function (body) {
    person = {}
    if (typeof body.services === 'string') {
      person.services = []
      person.services.push(body.services)
    } else {
      person.services = body.services || [];
    }
    person.name = body.name;
    person.rsvp = false;
    if (body.rsvp) {
      person.rsvp = true
    }
    console.log(person, 'in personRender')
    return person
  },
  
  addServices: function (body, person) {
    return new Promise(function (success) {
      var promiseArray = []
      console.log(body, "in add Services")
      if (typeof body.services === 'string') {
        servicesToAdd = []
        servicesToAdd.push(body.services)
      } else {
        servicesToAdd = body.services;
      }
      console.log('before find')
      if(servicesToAdd.length > 0){
        services.find({}).then(function (serviceArray) {
          console.log('found', servicesToAdd, serviceArray)
          servicesToAdd.forEach(function (addable) {
            var addService = true;
            serviceArray.forEach(function (service) {
              if (service.name === addable){
                console.log('found this', addable, service.name)
                addService = false;
              }
            })
            console.log(addService)
            if (addService) {
              promiseArray.push(services.insert({name: addable}))
            }
          })
          return Promise.all(promiseArray)
        }).then(function (promisestuff) {
          console.log(promisestuff, "*****************")
          success(person)
        })
      } else {
        success(person)
      }  
    })
  },
  
  addServicesToPerson: function (guest) {
    console.log('adding services to person!!', guest)
    return new Promise(function (success) {
      services.find({}).then(function (services) {
        var serviceKey = {}
        services.forEach(function (service) {
          serviceKey[service.name] = service._id;
        })
        guest.services = guest.services.map(function (str) {
          return serviceKey[str];
        })
        console.log('IDS rendered', guest);
        var guestout = guest;
        guests.update({_id: guest._id}, guest).then(success(guestout))
      })
    })
  },
  
  removeSong: function (songId) {
    return songCollection.remove({_id: songId})
  },
  
  removeGuest: function (id) {
    return guests.remove({_id: id})
  },
  
  rsvpUpdate: function (idArray) {
    if (typeof idArray === 'string'){
      idArray = [idArray]
    }
    return guests.find().then(function (allGuests) {
      promiseArray = [];
      allGuests.forEach(function (guest) {
        var rsvpGuest = false;
        for (var i = 0; i < idArray.length; i++) {
          console.log(guest._id.toString(), idArray[i])
          if (guest._id.toString() === idArray[i]){
            promiseArray.push(guests.update({_id:guest._id}, {$set: {rsvp: true}}))
            rsvpGuest = true;
          }
        }
        if (!rsvpGuest) {
          promiseArray.push(guests.update({_id: guest._id}, {$set: {rsvp: false}}))
        }
      })
      return Promise.all(promiseArray)
    })
  },
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports=calls