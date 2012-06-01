# a `Stream` spec

This document defines the behaviour that a `Stream` must implement in order to be compatible with `Stream#pipe`. This is not an official document, but is intended as a guide to produce correct behaviour in user-land streams.

This guide has three sections. Rules that apply to all streams whether they are readable or writable, to writable streams, and to readable streams. Note that it is possible for a stream to be both readable _and_ writable.

## Stream

All streams *may* emit `'error'` and `'close'`. All streams *may* implement `destroy` but a `WritableStream` *must* implement `destroy`.

### emit('close')

When it is no longer possible to read or write from the `Stream`, the `Stream` *must* emit `'close'`. Usually this is when it is physically impossible to read or write to the `Stream`, because in underlying resource is no longer available; for example, a disk is full, a connection is lost, or a process has terminated.

### emit('error')

All streams *should* emit `'error'` when an unexpected error has occurred.
All  streams *must not* throw an error, unless `write` has been called after `end`.
(which should never happen, in correct usage)

## WritableStream

A `WritableStream` *must* implement methods `write`, `end`, and `destroy`, and `writable` *must* be set to `true`, and *must* inherit `Stream#pipe`

### write(data)

`write` must return either `true` or `false`.
(if `false` then the writer *should* pause)
If `write` is called after end, an error *may* be thrown.

### end()

calling `end` *may* set `writable` to `false`. 
If the `Stream` is also readable, it *may* eventually emit 'end'.

### destroy()

Used to close a `Stream` prematurely. 
Calling `destroy` *must* cause `'close'` or `'end'` to be emitted, and *should* clean up any underling resources.

## ReadableStream

A `ReadableStream` *must* inherit `pipe`* from `Stream`, and set `readable` to `true`, and *must* emit zero or more 'data' events, followed by a single `end` event. A `ReadableStream` *may* implement `pause` and `resume` methods.

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

## request for comment

thank you in advance!