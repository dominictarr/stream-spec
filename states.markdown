# Stream state diagrams.

interperetation of these diagrams:
boxes are states. arrows are transitions.
transitions are labled with the events which cause those
transitions. if an event is mentioned on the diagram,
but is not on a transition from a particular state,
it means that event is forbidden in that state. 

if an event is not mentioned in a diagram, then
that event is not forbidden, just irrelevant.

where events are listed next to a transition, it 
means that any of those events may cause that transition.

combining diagrams: I have represented stream behaviour
across multiple diagrams for simplicity. 
Stream implementations must satisify all relevant diagrams.

## write / pause

```
write()===false              write()==false
     .--.                         .--.
     |  |                         |  |
     |  v                         |  v
  .---------.  write()===false .--------.
  |         |----------------->|        |
  | !paused |                  | paused |
  |         |<-----------------|        |
  `---------`     'drain'      `--------`
               
```

A `WritableStream` must emit `'drain'` to leave the paused state.
A `WritableStream` may only return `false` from `write()` when paused.

## writable/!writable

```
  write(), 'drain'
     .--.
     |  |
     |  v
  .----------.                .-----------.
  |          |--------------->|           |
  | writable |   end(),       | !writable |
  |          |   destroy()    |           |
  `----------`                `-----------`
        |                          |
        |                          |  'error', 'close'
        |                          v
        |                     .-----------.
        |  'error'            |           |
        `-------------------- | closed,   |
                              | !writable |
                              |           |
                              `-----------`

```


A `WritableStream` may not emit 'drain' or permit `write()` after `end()`, `'error'`
or `destroy()` have occured. 
A `WritableStream` must eventually emit `'close'`, unless there is an 'error'.

## read / pause (strict)

```
'data', 'end'
     .--.
     |  |
     |  v
  .---------.    pause()  .--------.
  |         |------------>|        |
  | !paused |             | paused |
  |         |<------------|        |
  `---------`   resume()  `--------`
  
```

A strict `ReadableStream` must not emit 'data' or 'end' when in the paused state.  
In `0.8` most core node streams are now strict.

## read / pause (loose)

```
'data', 'end',
pause(), resume()
     .--.
     |  |
     |  v
  .---------.
  |         |
  | paused, |
  | !paused |
  `---------`
  
```

A unstrict `ReadableStream` should _try_ not to emit 'data' or 'end' when paused.  
In `0.8` most core node streams are now strict.

## readable / !readable

```
    'data'
     .--.
     |  |
     |  v
  .----------.                .-----------.
  |          |--------------->|           |
  | readable |   'end',       | !readable |
  |          |   destroy()    |           |
  `----------`                `-----------`
        |                          |
        |                          |  'error', 'close'
        |                          v
        |                     .-----------.
        |  'error'            |           |
        `-------------------- | closed,   |
                              | !readable |
                              |           |
                              `-----------`

```

A `ReadableStream` must not emit 'data' after 'end', 'error', or destroy(). 
A `ReadableStream` must then eventually emit `'close'`, unless there was an 'error'.

