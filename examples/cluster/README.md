# Kardia master-worker cluster example

This is a simple example of how Kardia can be used in the master-worker cluster context. The first rule of thumb is that you won't have to start Kardia more than once per the entire cluster.

### On the master process

On the master process (**just once** in the entire master process scope), you have to start Kardia using the following syntax:

```javascript
var kardia = require('kardia').start({ name: "master-worker-cluster-example", port: 12800 });
```

In case you want to use Kardia from multiple source files inside the master process, you only have to use the following syntax:

```javascript
var kardia = require('kardia');
```

...and you're done.

### On the worker process(es)

```javascript
var kardia = require('kardia');
```

...and you're done.
