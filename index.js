var a = require('assertions')
var macgyver = require('macgyver')

module.exports = function (stream) {
  var mac = macgyver()
  var spec = {}

  function add(name, method) {
    spec[name] = function (opts) {
      method(mac, stream, opts)
      return this
    }
  }

  add('through', throughSpec)
  add('readable', readableSpec)
  add('writable', writableSpec)
  add('basic', throughSpec)
  add('readableWritable', throughSpec)
  add('pausable', pauseSpec)
  add('strictPausable', strictPauseSpec)

  spec.all = function (opts) {
    if(stream.writable && stream.readable)
      return this.through(opts).pausable(opts)
    else if(stream.writable)
      return this.writable().pausable()
    else
      return this.readable()
  }

  spec.validate = function () {
    mac.validate()
    return this
  }

  spec.validateOnExit = function () {
    //your test framework probably has assigned a listener for on exit also,
    //make sure we are first. so the framework has a chance to detect a
    //validation error.
    process.listeners('exit').unshift(function () {
      try {
        mac.validate()
      } catch (err) {
        console.error(err && err.stack)
        throw err
      }
    })
    return this
  }

  return spec
}

function writableSpec (mac, stream, opts) {
  opts = opts || {end: true}

  stream.end = mac(stream.end).returns(function () {
    a.equal(stream.writable, false, 'stream must not be writable after end()')
  })
  stream.write = 
    mac(stream.write)
    .throws(function (err, threw) {
//      a.equal(threw, !stream.writable, 'write should throw if !writable')
    })

  var onClose = mac(function close(){}).once()
  var onError = mac(function error(){}).before(onClose)

  stream.on('close', onClose)
  stream.on('error', onError)

  if(opts.error === false)
    onError.never()
  if(opts.error === true)
    onError.once() 
}

function readableSpec (mac, stream, opts) {

  opts = opts || {end: true}

  var onClose = mac(function close(){}).once()
  var onError = mac(function error(){}).before(onClose)
  var onEnd   = mac(function end  (){}).before(onClose).before(onError)
    .isPassed(function () {
      a.equal(stream.readable, false, 'stream must not be readable on "end"')
    })
  var onData  = mac(function data (){}).before(onEnd)

  stream.on('close', onClose)
  stream.on('end', onEnd)
  stream.on('data', onData)

  if(opts.end)
    onEnd.once()

  if(opts.error === false)
    onError.never()
  if(opts.error === true)
    onError.once() 

}

function throughSpec (mac, stream, opts) {
  writableSpec(mac, stream, opts)
  readableSpec(mac, stream, opts)
}

function pauseSpec (mac, stream, opts) {
  opts = opts || {}
  var paused = false
  function drain() {
    paused = false
  } 
  var onDrain = mac(drain).never()
  
  a.ok(stream.pause, 'stream *must* have pause')

  if(!stream.readable)
    throw new Error('strict pause does not make sense for a non-readable stream')

  stream.pause = mac(stream.pause)
    .isPassed(function () {
      if(paused) return
      //console.log('entered pause state by pause()')
      paused = true
      onDrain.again()
    })

  /*
  hmm, there is writable pause, and readable pause.
  readable pause starts on pause() and ends on resume()
  writable pause starts on write() === false, and ends on 'drain'

  readable streams need not emit drain.
  */

  stream.on('drain', onDrain)
  if(stream.writable) {
    stream.write = 
      mac(stream.write)
      .returns(function (written) {
        a.isBoolean(written, 'boolean')     //be strict.

        if(!paused && !written) {
          //after write returns false, it must emit drain eventually.
          //console.log('entered pause state by write() === false')
          onDrain.again()
        }
        paused = !written
      })
  }
  if(opts.strict)
    stream.on('data', function onData(data) {
      //stream must not emit data when paused!
      a.equal(paused, false, 'a strict pause stream *must not* emit \'data\' when paused')
    })
}
/*
  demand that the stream does not emit any data when paused
*/
function strictPauseSpec (mac, stream, opts) {
  opts = opts || {}
  opts.strict = true
  paused = false
  if(!stream.readable)
    throw new Error('strict pause does not make sense for a non-readable stream')

  stream.pause = mac(stream.pause)
    .isPassed(function () {
      paused = true
    })
  stream.resume = mac(stream.resume)
    .isPassed(function () {
      paused = false
    })
  stream.on('data', function () {
    a.equal(paused, false, 'a strict pausing stream must not emit data when paused')
  })
}
