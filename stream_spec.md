# a `Stream` spec

This document defines the behaviour that a `Stream` must implement in order to be compatible with `Stream#pipe`. This is not an official document, but is intended as a guide to produce correct behaviour in user-land streams.

This guide has three sections. Rules that apply to all streams whether they are readable or writable, to writable streams, and to readable streams. 

* Note that it is possible for a stream to be both readable _and_ writable.

## Stream

All streams *must* emit `'error'` if writing to or reading from becomes physically impossible. `'error'` implys that the stream has ended.

All streams *may* emit `'close'`. `'close'` means that any underlying resources have been disposed of. 

A `Stream` *must not* emit `'error'` if the error is recoverable. 
(that is not in the stream spec)

All streams *should* implement `destroy` but a `WritableStream` *must* implement `destroy`.

### emit('error')

All streams *must* emit `'error'` when an error that is not recoverable has occurred. If it has become physically impossible to write to or read from the `Stream`, then emit `'error'`.

A `WriteableStream` *may* throw an error if `write` has been called after `end`.
(which should never happen, in correct usage)

otherwise, a stream *must never* throw an error. (always emit)

## WritableStream

A `WritableStream` *must* implement methods `write`, `end`, and `destroy`, and `writable` *must* be set to `true`, and *must* inherit `Stream#pipe`

### write(data)

`write` must return either `true` or `false`.
(if `false` then the writer *should* pause)
If `write` is called after end, an error *may* be thrown.

### end()

calling `end` *may* set `writable` to `false`. 
If the `Stream` is also readable, it *must* eventually emit 'end'.

### destroy()

Used to dispose of a `Stream`.

Calling `destroy` *must* dispose of any underlying resources.
Calling `destroy` *must* emit `'close'` eventually, 
once any underlying resources are disposed of.

## ReadableStream

A `ReadableStream` *must* inherit `pipe` from `Stream`, and set `readable` to `true`, and *must* emit zero or more 'data' events, followed by a single `end` event. A `ReadableStream` *may* implement `pause` and `resume` methods.

* I will not bother to specify the behaviour of `pipe` because I am attempting to document what must be done in order for your `Stream` to be compatible with `pipe`.

### emit('data', data)

A `ReadableStream` *may* emit zero or more `'data'` events.
A `ReadableStream` *must not* emit emit a `'data'` event after it has emitted `'end'` 

### emit('end')

A `ReadableStream` *should* emit an `'end'` event when it is not going to emit any more `'data'` events. `'end'` *must not* be emitted more than once. A `ReadableStream` may set `readable` to `false` after it has emitted the `'end'` event.

### pause()

A readable `Stream` *may* implement the `pause` method. When `pause` is called, the stream should attempt to emit `'data'` less often. (possibly stopping altogether until `resume` is called)

### resume()

A `ReadableStream` *may* implement the `resume` method. If the `Stream` has been paused, it may now emit `'data'` more often, or commence emitting `data` if it has stopped all together.

### destroy()

A `ReadableStream` *should* implement `destroy`.

Calling `destroy` *must* dispose of any underlying resources.
Calling `destroy` *must* emit `'close'` eventually, 
once any underlying resources are disposed of.

## request for comment

thank you in advance!