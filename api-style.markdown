# Stream API Style.

I've been writing lots of modules that act interact with, through, or on streams.

here are my opinions on the right was to build a stream related interface.

these are my principles:

  1. be idiomatic: follow an api from node core, where possible.
  2. be obvious: choose a pattern that makes the behaviour clear.
  3. be prime: the length of a list needs to be a non even prime, or it looks weird.

## function that creates a Stream

Call a method that returns a stream. 
where possible, use this pattern. 

A stream should be created and then piped to other streams.
passing a stream to a function should be avoided.

``` js
var stream = net.connect(port, host)

//good
stream.pipe(dnode({hi: hello})).pipe(stream) 

//un-good
myRpc({hi: hello}, stream)

//double-un-good

myRpc({hi: hello}, port, host)

```

using the form `createTYPEStream` is encouraged. 
The call must return a stream synchronously, 
and then buffer writes until writes can be made.

Don't if you are building a highlevel api with streaming something 
(like RPC) try and use this pattern. How your thing works is less 
obvious if you pass the stream to it. (exactly what does it do to the stream?
you have to read the code. better to interact in a generic way, like `Stream#pipe`)

Also, do not callback a stream asynchronously 

``` js

createStream(function (err, stream) {
  //you don't need callbacks if you are using streams.
  //emit the error on the stream instead.
})
```

if you find your self wanting to use this pattern try [streamin](https://github.com/fent/node-streamin)

### do

  * [dnode](https://github.com/substack/dnode)
  * [mux-demux](https://github.com/dominictarr/mux-demux)
  * [shoe](https://github.com/substack/shoe)

### don't

  * [smith](https://github.com/c9/smith) this could have returned a stream and piped to it.

## Server style - EventEmitter that emits streams

Like a server, multiple streams are creating at unknown times.
This is a familiar pattern with Servers, 
but is also seen with reconnectors.

``` js
net.createServer(function (stream) {
  //you can pass in a function,
  //but it's just a shorthand for assigning an event listener
}).listen(port)
```

returns an event emitter what emits streams,
on an event named `'connection'`. 
If it is a server, it should have a method named `.listen(port, host, cb)`
(be idiomatic: don't pass a port option to create server)


### Another Example - reconnect

[reconnect](https://github.com/dominictarr/reconnect) also follows this pattern,
except that the streams emitted are always one at a time.

``` js
reconnect(function (stream) {
  //looks just like the server pattern,
  //except streams are emitted one after another.

}).connect()
```

### do

  * [reconnect](https://github.com/dominictarr/reconnect)
  * [mux-demux](https://github.com/dominictarr/mux-demux)
  * [autonode](https://github.com/dominictarr/autonode)

## mutate a stream - pass to a function

Only pass a stream to a function when you couldn't possibly have used the other pattern.

You don't really know what it does to the stream, 
because it's hidden inside the function.

You will probably need to read the code, and that is hard work. 
It is much better to use one of the above patterns, if possible.

[duplexer](https://github.com/Raynos/duplexer) creates a single readable, writable (duplex) stream from 
a WritableStream and a ReadableStream. That is pretty weird, right? 
This couldn't have been done with out passing the streams to a function, so it's okay.

you may save a few lines by using this pattern,
but they will be much less obvious.

``` js
var duplex = require('duplexer')
var cp = require('child_process')
var child = cp.spawn(cmd, args)

duplex(child.stdin, child.stdout)
```

### do

  * [stream-spec](https://github.com/dominictarr/stream-spec)
  * [emit-stream](https://github.com/substack/emit-stream)
  * [duplexer](https://github.com/Raynos/duplexer)

