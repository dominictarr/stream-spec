# a `Stream` spec

This document defines the behaviour that a stream must implement in order to be compatible with `Stream#pipe`. This is not an official document, but is intended as a guide to produce correct behaviour in user-land streams.

this guide has three sections. Rules that apply to writable streams, readable streams, and to all streams whether they are readable or writable. note that it is possible for a stream to be both readable _and_ writable.

## Stream

All `Stream`s *may* emit `'error'` and `'close'`. All `Stream`s *may* implement `destroy` but a writable stream *must* implement `destroy`.

### emit('close')

When it is no longer possible to read or write from the stream, the stream *must* emit `'close'`. Usually this is when it is physically impossible to read or write to the stream, because in underlying resource is no longer available; for example, a disk is full, a connection is lost, or a process has terminated.

### emit('error')

All `Stream`s *should* emit `'error'` when an unexpected error has occurred.
All  `Stream`s *must not* throw an error, unless `write` has been called after `end`.
(which should never happen, in correct usage)

## WritableStream

A writable stream *must* implement methods `write`, `end`, and `destroy`, and `writable` *must* be set to `true`, and *must* inherit `Stream#pipe`

### write(data)

`write` must return either `true` or `false`.
(if `false` then the writer *should* pause)
If `write` is called after end, an error *may* be thrown.

### end()

calling `end` *may* set `writable` to `false`. 
If the stream is also readable, it *may* eventually emit 'end'.

### destroy()

used to close a stream prematurely. 
calling destroy *must* cause `'close'` or `'end'` to be emitted, and *should* clean up any underling resources.

## ReadableStream

A `ReadableStream` *must* set `readable` to `true`, and *must* emit zero or more 'data' events, followed by a single `end` event.
A `ReadableStream` *may* implement `pause` and `resume` methods.

### emit('data', data)

A `ReadableStream` *may* emit zero or more `'data'` events.
A `ReadableStream` *must not* emit emit a `'data'` event after it has emitted `'end'` 

### emit('end')

A `ReadableStream` *should* emit an `'end'` event when it is not going to emit any more `'data'` events. `'end'` *must not* be emitted more than once. A `ReadableStream` may set `readable` to `false` after it has emitted the `'end'` event.

### pause()

A readable `Stream` *may* implement the `pause` method. When `pause` is called, the stream should attempt to emit `'data'` less often. (possibly stopping altogether until `resume` is called)

### resume()

A readable `Stream` *may* implement the `resume` method. If the stream has been paused, it may now emit `'data'` more often.

