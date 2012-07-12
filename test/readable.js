
var Stream = require('stream')
var spec = require('..')

var tests = 0
function pass(message) {
  console.log('ok ' + ++tests, message ? ' -- ' + message : '')
}
function fail(message) {
  console.log('not ok ' + ++tests, message ? ' -- ' + message : '')
}

function checkValid(contract, expectFail) {
  return function (create, test) {
    var stream = create()
    try {
      var validate = contract(stream, spec).validate
      test(stream)
      validate()
    } catch (err) {
      if(!expectFail) {
        fail(err.message); throw err
      }
      return pass(err.message)
    }
    if(expectFail) {
      throw new Error('expected error')
    }
    pass('valid')
  }
}

var valid = checkValid(function (stream, spec) {
  return spec(stream).readable()
}, false)

var invalid = checkValid(function (stream, spec) {
  return spec(stream).readable()
}, true)

//does not emit 'end'
invalid(function () {
  var s = new Stream()
  return s
}, function (s) {
})

//does not set readable = false, on 'end'
invalid(function () {
  var s = new Stream()
  s.destroy = function () {}
  s._end = function () {
    this.emit('end')
  }
  return s
}, function (s) {
  s._end()
})

//does not set emit 'close'
invalid(function () {
  var s = new Stream()
  s.destroy = function () {}
  s._end = function () {
    this.readable = false
    this.emit('end')
  }
  return s
}, function (s) {
  s._end()
})

valid(function () {
  var s = new Stream()
  s.destroy = function () {}
  s._end = function () {
    this.readable = false
    this.emit('end')
    this.emit('close')
  }
  return s
}, function (s) {
  s._end()
})


