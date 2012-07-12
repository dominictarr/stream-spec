
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
  }
}

var valid = checkValid(function (stream, spec) {
  return spec(stream).writable()
}, false)

var invalid = checkValid(function (stream, spec) {
  return spec(stream).writable()
}, true)

var wrong1 = function () {
  var s = new Stream()
  s.write = function () {}
  s.destroy = function () {}
  //s.end = function () {}
  //s.writable = true
  return s 
}
var wrong2 = //fails because end isn't defined
invalid(function () {
  var s = new Stream()
  s.write = function (){ }
  s.destroy = function () {}
  //s.end = function () {}
  s.writable = true
  return s 
}, function (s) {})

//fails because end isn't defined
invalid(function () {
  var s = new Stream()
  s.write = function (){ }
  s.destroy = function () {}
  s.end = function () {}
  //s.writable = true
  return s 
}, function (s) {})


//fails because end isn't called
invalid(function () {
  var s = new Stream()
  s.write = function (){ }
  s.destroy = function () {}
  s.end = function () {}
  s.writable = true
  return s 
}
, function (s) {
  s.write('hello')
})

//fails because end doesn't set writable = false
invalid(function () {
  var s = new Stream()
  s.write = function (){ }
  s.destroy = function () {}
  s.end = function () {}
  s.writable = true
  return s 
}, function (s) {
  s.write('hello')
  s.end()
})
//fails because does not emit 'close'
invalid(function () {
  var s = new Stream()
  s.write = function (){ }
  s.destroy = function () {}
  s.end = function () {this.writable = false}
  s.writable = true
  return s 
}, function (s) {
  s.write('hello')
  s.end()
})

//passes
valid(function () {
  var s = new Stream()
  s.write = function (){ }
  s.destroy = function () {}
  s.end = function () {
    this.writable = false
    this.emit('close')
  }
  s.writable = true
  return s 
}, function (s) {
  s.write('hello')
  s.end()
})

