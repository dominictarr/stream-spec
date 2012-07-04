# StreamSpec

`stream-spec` is a executable specification for Stream.
it's purpose it to make it easy to test user-land streams have correct behavour.

``` js
var spec = require('stream-spec')
spec(stream)
  .readableWritable({error: false})
  .pausable()
  .validateOnExit()

stream.write('data')
//...
```


