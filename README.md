Kardia
======

A common process status API interface to expose Node.js process status operational/internal indicators.
JSON format over HTTP protocol.

Why?
====

When running several Node.js based processes across different servers like we do here at Pipedrive, we discovered
it becomes increasingly difficult to monitor the state of different internal variables inside these processes.
To address this, we created a common status API interface which can be centrally consumed. Kardia is the part of
this protocol which facilities the "status page" per each (master) process.

Usage
=====
```
npm install kardia
```

Then, in your code:

```javascript
var Kardia = require('kardia');
var kardia = Kardia.start({ name: "My process", port: 12900 });
```

When you're using Node.js cluster with multiple worker processes, it is intended that Kardia is used on the
master process, and all workers can ping their update/change requests about Kardia data to the master
process.

Methods
=======

## kardia.increment("some counter", 2);

Increment a counter. The counter gets created if it did not exist yet. Useful for analyzing execution cycles
of specific functionality.

## kardia.set("some key", "some value");

Set a specific value to the status page. Useful for connection status indications.

Licence
=======

MIT.
