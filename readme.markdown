# StreamSpec

Automatic checking of the Stream implementations.
`stream-spec` instruments your stream to verify that it has correct behaviour.
All you need to do to test a stream is to wrap it with `stream-spec`, and then pipe
some test data through it.
it's purpose it to make it easy to test user-land streams have correct behavour.

correct stream behaviour [illustrated](https://github.com/dominictarr/stream-spec/blob/master/states.markdown)  

correct stream behaviour [explained](https://github.com/dominictarr/stream-spec/blob/master/stream_spec.md)  

stream api design [style](https://github.com/dominictarr/stream-spec/blob/master/api-style.markdown) 

## a simple test

using [stream-tester](https://github.com/dominictarr/stream-tester) 

``` js
var spec = require('stream-spec')
var tester = require('stream-tester')

spec(stream)
  .through({strict: true})
  .validateOnExit()

tester.createRandomStream(function () {
    return 'line ' + Math.random() + '\n'
  }, 1000)
  .pipe(stream)
  .pipe(tester.createPauseStream())

```

send 1000 random lines through the stream and check that
it buffers on pause.

## types of `Stream`

### Writable (but not readable)

a `WritableStream` must implement `write`, `end`, `destroy` and emit `'drain'` if it pauses,
and `'close'` after the stream ends, or is destroyed.

If the stream is sync (does no io) it probably does not need to pause, so the `write()` should never equal `false`

``` js
spec(stream)
  .writable()
  .drainable()
  .validateOnExit()
```

### Readable (but not writable)

a `ReadableStream` must emit `'data'`, `'end'`, and implement `destroy`,
and `'close'` after the stream ends, or is destroyed.
is strongly recommended to implement `pause` and `resume`

If the option `{strict: true}` is passed, it means the stream is not allowed to emit
`'data'` or `'end'` when the stream is paused.

If the option `{end: false}` is passed, then end may not be emitted.

``` js
spec(stream)
  .readable()
  .pausable({strict: true})) //strict is optional.
  .validateOnExit()
```

### Through (sync writable and readable, aka: 'filter')

A `Stream` that is both readable and writable, and where the input is processed and then emitted as output, more or less directly. 
Example, [zlib](http://nodejs.org/api/zlib.html). contrast this with duplex stream.

when you call `pause()` on a `ThroughStream`, it should change it into a paused state on the writable side also,
and `write()===false`. Calling `resume()` should cause `'drain'` to be emitted eventually.

If the option `{strict: true}` is passed, it means the stream is not allowed to emit
`'data'` or `'end'` when the stream is paused.

``` js
spec(stream)
  .through({strict: true}) //strict is optional. 
  .validateOnExit()
```

### Duplex

A `Stream` that is both readable and writable, but the streams go off to some other place or thing,
and are not coupled directly. The readable and writable side of a `DuplexStream` has thier own pause state.

If the option `{strict: true}` is passed, it means the stream is not allowed to emit
`'data'` or `'end'` when the stream is paused.

``` js
spec(stream)
  .duplex({strict: true})
  .validateOnExit()
```

### other options

``` js
spec(stream, name) //use name as the name of the stream in error messages.

spec(stream, {
  name: name,   //same as above.
  strict: true, //'data' nor 'end' may be emitted when paused.
  error: true,  //this stream *must* error.
  error: false, //this stream *must not* error.
                //if neither error: boolean option is passed, the stream *may* error.
  })



```
