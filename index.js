var a = require('assertions')
var macgyver = require('macgyver')
var Stream = require('stream')

function merge (to, from) {
  to = to || {}
  for (var k in from)
    if('undefined' === typeof to[k])
      to[k] = from[k]
  return to
}


module.exports = function (stream, opts) {
  
  a.isInstanceof(stream, Stream)
  a.property(stream,'pipe', a._isFunction())
  a.property(stream,'destroy', a._isFunction())

  var mac = macgyver()
  var opts = merge(('string' == typeof opts ? {name: opts} : opts) || {}, {name: 'stream'})
  var spec = {}
  function add(name, method) {
    spec[name] = function (_opts) {
      method(mac, stream, merge(_opts, opts))
      return this
    }
  }

  add('through'     , throughSpec)
  add('basic'       , throughSpec) //legacy, remove this.
  add('duplex'      , duplexSpec)
  add('readable'    , readableSpec)
  add('writable'    , writableSpec)
  add('pausable'    , pauseSpec)
  add('drainable'   , drainSpec)
  add('strictPause' , strictSpec)

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
  a.isFunction(stream.end, opts.name + '.end *must* be a function')
  a.equal(stream.writable, true, opts.name + '.writable *must* == true')
  function e (n) { return opts.name + '.emit(\''+n+'\')' }
  function n (n) { return opts.name + '.'+n+'()' }

  stream.end = mac(stream.end, n('end')).returns(function () {
    a.equal(stream.writable, false, opts.name + ' must not be writable after end()')
  }).once()
  stream.write = 
    mac(stream.write, n('write'))
    .throws(function (err, threw) {
//      a.equal(threw, !stream.writable, 'write should throw if !writable')
    })

  var onClose = mac(function (){
    if(opts.debug) console.error(e('close'))
  }, e('close')).once()
  var onError = mac(function (err){
    if(opts.debug) console.error(e('error'), err)
  },  e('error')).before(onClose)

  stream.on('close', onClose)
  stream.on('error', onError)

  if(opts.error === false)
    onError.never()
  if(opts.error === true)
    onError.once() 
}

function readableSpec (mac, stream, opts) {

  merge(opts, {end: true})
  function e (n) { return opts.name + '.emit(\''+n+'\')' }
  function n (n) { return opts.name + '.'+n+'()' }


  var onError = mac(function (err){
    //'error' means the same thing as 'close'.
    onClose.maybeOnce()
    if(opts.debug) console.error(e('error'), err)
  },  e('error'))
  //.before(onClose) error does not emit close, officially, yet.

  var onEnd = mac(function end  (){
    if(opts.debug) console.error(e('end'), err)
  }, e('end'))
  .once()

  .isPassed(function () {
    a.equal(stream.readable, false, 'stream must not be readable on "end"')
  })

  var onClose = mac(function (){
    if(opts.debug) console.error(e('close'))
  }, e('close'))
  .once()

  onEnd.before(onClose).before(onError)

  var onData  = mac(function data (){}, e('data')).before(onEnd)

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
  throughPauseSpec(mac, stream, opts) 
}

function duplexSpec (mac, stream, opts) {
  writableSpec(mac, stream, opts)
  readableSpec(mac, stream, opts)
  pauseSpec(mac, stream, opts) 
  drainSpec(mac, stream, opts) 
}

function drainSpec (mac, stream, opts) {
  var paused = false
  function e (n) { return opts.name + '.emit(\''+n+'\')' }
  function n (n) { return opts.name + '.'+n+'()' }

  function drain() {
    paused = false
  } 
  var onDrain = mac(drain).never()
  
  stream.on('drain', onDrain)
  stream.write = 
    mac(stream.write, n('write'))
    .returns(function (written) {

      if(!paused && !written) {
        //after write returns false, it must emit drain eventually.
        onDrain.again()
      }
      paused = (written === false)
    })
 
}

//for through-streams

function throughPauseSpec (mac, stream, opts) {
  var paused = false

  function e (n) { return opts.name + '.emit(\''+n+'\')' }
  function n (n) { return opts.name + '.'+n+'()' }

  function drain() {
    paused = false
  } 
  var onDrain = mac(drain, e('drain')).never()
  
  a.ok(stream.pause, 'stream *must* have pause')

  if(!stream.readable)
    throw new Error('pause does not make sense for a non-readable stream')

  stream.pause = mac(stream.pause, n('pause'))
    .isPassed(function () {
      if(paused) return
      //console.log('entered pause state by pause()')
      paused = true
      onDrain.again()
    })

  stream.on('drain', onDrain)
  stream.write = 
    mac(stream.write, n('write'))
    .returns(function (written) {

      if(!paused && !written) {
        //after write returns false, it must emit drain eventually.
        //console.log('entered pause state by write() === false')
        onDrain.again()
      }
      paused = (written === false)
    })

  if(opts.strict)
    stream.on('data', function onData(data) {
      //stream must not emit data when paused!
      a.equal(paused, false, 'a strict stream *must not* emit \'data\' when paused')
    })
}
/*
  demand that the stream does not emit any data when paused
*/
function pauseSpec (mac, stream, opts) {
  paused = false
  function e (n) { return opts.name + '.emit(\''+n+'\')' }
  function n (n) { return opts.name + '.'+n+'()' }

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
  if(opts.strict)
    stream.on('data', function () {
      a.equal(paused, false, 'a strict pausing stream must not emit data when paused')
    })
}

function strictSpec (mac, stream, opts) {
  return pauseSpec(mac, stream, merge(opts, {strict: true}))
}
