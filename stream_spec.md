# a `Stream` spec

This document defines the behaviour that a `Stream` must implement in order to be compatible with `Stream#pipe`. 
This is not an official document, but is intended as a guide to produce correct behaviour in user-land streams.

## Stream

All streams *must* emit `'error'` if writing to or reading from becomes physically impossible. 
`'error'` implys that the stream has ended, do not emit `'end'` after error, `'close'` may be emitted.

All streams *should* emit `'close'`.
`'close'` means that any underlying resources have been disposed of.
`'close'` must be emitted either after end, or instead of `'end'`.

Emitting `'close'` without `'end'` indicates a broken pipe - `Stream#pipe` will call `dest.destroy()`

If a `ReadableStream` has ended normally, it *must not* emit `'close'` before `'end'`.

A `Stream` *must not* emit `'error'` if the error is recoverable. 
(that is not in the stream spec)

All streams *should* implement `destroy` but a `WritableStream` *must* implement `destroy`.

### emit('error')

All streams *must* emit `'error'` when an error that is not recoverable has occurred. 
If it has become physically impossible to write to or read from the `Stream`, then emit `'error'`.

A `WriteableStream` *may* throw an error if `write` has been called after `end`.
(which should never happen, in correct usage)

otherwise, a stream *must never* throw an error. (always emit)

## WritableStream

A `WritableStream` *must* implement methods `write`, `end`, and `destroy`, 
and `writable` *must* be set to `true`, and *must* inherit `Stream#pipe`

### write(data)

`write` must return either `true` or `false`.
(if `false` then the writer *should* pause)
If `write` is called after end, an error *may* be thrown.

If `write` returns `false`,it *must* eventually emit `'drain'`. 
`write` returning `false` means the stream is paused. 
paused means (or downstream) is at capacity, 
and the writer/upstream *should attempt* to slow down or stop. 
It does not mean all data must be buffered, although that is something a stream may reasonably do.

### end()

Calling `end` *must* set `writable` to `false`. 
If the `Stream` is also readable, it *must* eventually emit `'end'`, and then `'close'`.
If the `Stream` in not also readable, it *must* eventually emit `'close'` but not emit `'end'`.

### destroy()

Used to dispose of a `Stream`.

Calling `destroy` *must* dispose of any underlying resources.
Calling `destroy` *must* emit `'close'` eventually, 
once any underlying resources are disposed of.


### emit ('drain')

After pausing, a `Stream` must eventually emit `'drain'`. 
For example, when if a call to `write() === false`,  
`Stream#pipe` will call `pause` on the source and  
then call `source.resume()`, when the dest emits `'drain'`.

If drain is not emitted correctly, it's possible for `'data'` events to stop coming 
(depending on the source's behaviour when paused).

## ReadableStream

A `ReadableStream` *must* inherit `pipe` from `Stream`, 
and set `readable` to `true`, and *must* emit zero or more 'data' events, 
followed by a single `end` event. A `ReadableStream` *may* implement `pause` and `resume` methods.

* I will not bother to specify the behaviour of `pipe` because I am attempting to document what must be done in order for your `Stream` to be compatible with `pipe`.

### emit('data', data)

A `ReadableStream` *may* emit one or more `'data'` events.
A `ReadableStream` *must not* emit emit a `'data'` event after it has emitted `'end'` 

### emit('end')

A `ReadableStream` *should* emit an `'end'` event when it is not going to emit any more `'data'` events. 
`'end'` *must not* be emitted more than once. 
A `ReadableStream` may set `readable` to `false` after it has emitted the `'end'` event.

Also, a `Stream` should internally call `destroy` after it has emitted `'end'`. 

### emit ('close')

A `ReadableStream` *must* emit a `'close'` event after the `'end'` event. `'close'` *must* only be emitted once. if `destroy` is called, `'close'` must be emitted, unless the stream has already ended normally. If `'close'` is emitted before `'end'` that signifies a broken stream, this *should* only happen if `destroy` was called. 

Emitting close will cause `pipe` to call `destroy` on the down stream pipe, if it is emitted before `end`. 

### pause()

A readable `Stream` *may* implement the `pause` method. 
When `pause` is called, the stream should attempt to emit `'data'` less often. 
(possibly stopping altogether until `resume` is called)

### resume()

A `ReadableStream` *may* implement the `resume` method. 
If the `Stream` has been paused, it may now emit `'data'` more often, 
or commence emitting `data` if it has stopped all together.

If a stream is also writable, and has returned `false` on `write` it *must* now eventually emit `drain`

### destroy()

A `ReadableStream` *should* implement `destroy`.

Calling `destroy` *must* dispose of any underlying resources.
Calling `destroy` *must* emit `'close'` eventually, 
once any underlying resources are disposed of.

