
## write / pause

```
write()===false                write()==false
     .--.                          .--.
     |  |                          |  |
     |  v                          |  v
  .----------.  write()===false .----------.
  |          |----------------->|          |
  | !paused, |                  | paused,  |
  | writable |<-----------------| writable |
  |          |     'drain'      |          |
  `----------`                  `----------`
               
```

## writable/!writable

```
write(), 'drain'
     .--.
     |  |
     |  v
  .----------.                .-----------.         .--------.
  |          |--------------->|           |-------->|        |
  | writable |   end(),       | !writable | 'close' | closed |
  |          |   'error',     |           |         |        |
  `----------`   destroy()    `-----------`         `--------`

```

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

## readable / !readable

```
    'data'
     .--.
     |  |
     |  v
  .----------.                .-----------.         .--------.
  |          |--------------->|           |-------->|        |
  | readable |   'end',       | !readable | 'close' | closed |
  |          |   'error',     |           |         |        |
  `----------`   destroy()    `-----------`         `--------`

```


