Kardia
======

A humane process status API module to expose any operational/internal indicators of any Node.js process for status aggregation and monitoring. JSON format over HTTP protocol.

[![NPM version](https://badge.fury.io/js/kardia.svg)](http://badge.fury.io/js/kardia)

Why?
====

When running several Node.js based processes across different servers like we do here at Pipedrive, we discovered
it becomes increasingly difficult to monitor the state of different internal variables inside these processes.
To address this, we created a common status API interface which we consume and analyze centrally, with all Node.js processes on all servers exposing their internal status using Kardia.

* A common interface (JSON over HTTP) that can be consumed in a ton of different ways
* Human-readable out of the box
* Use the same way across master and worker processes (all workers' statuses get aggregated to master for output automatically)

Usage
=====
```
npm install kardia
```

In your code to start Kardia:

```javascript
var Kardia = require('kardia');
var kardia = Kardia.start({ name: "My process", port: 12900 });
```

Then, when run on the master process, Kardia will create a new HTTP server on the designated port (default 12900) which lists the indicators of the running process in JSON format. On the worker process (using Node.js's cluster module), it will expose the same interface and start collecting data which it sends back to the master process automatically using IPC to be displayed with the Kardia HTTP server along with data from the master and all worker processes.

The status page (thus visible at ```http://localhost:12900```) will include the following components:
 * **service** – The name of the service running
 * **pid** – The PID of the master process
 * **env** – The running environment of the process (derived from ```process.env.NODE_ENV```)
 * **uptime** – The master process uptime in seconds
 * **uptime_formatted** – Human-readable uptime (e.g. 2 hours, 48 minutes, 54 seconds)
 * **startTime** — ISO-formatted timestamp of the start time of master process
 * **curTime** — ISO-formatted timestamp of the current time in server
 * **uid** — process.uid of the master process
 * **gid** — process.gid of the master process
 * **values** — key-value container for any user-defined variables using ```kardia.set()``` method
 * **counters** — key-value container for any user-defined counters using ```kardia.increment()``` and ```kardia.decrement()``` methods
 * **stacks** — container for any user-defined stacks using ```kardia.startStack()``` and ```kardia.stack()``` methods
 * **workers** — array of worker processes (kept in sync automatically and populated with data from each worker when using Node.js's cluster module)
 * **remoteAddress** — the IP address of the status page requestor
 * **network** — a dump of available network interfaces on the server
 * **hostname** — name of the server the process is running on
 * **memory** — a dump of the current and initial memory state, and a diff comparing the two
 * **fallBehind** — V8 code execution delay indicator
 * **os** — a dump of operating system data
 * **config** — the configuration which Kardia is currently using

Here's an example of the status page:

```json
{
    "service": "example-service",
    "pid": 52298,
    "env": "development",
    "uptime": 10134,
    "uptime_formatted": "2 hours, 48 minutes, 54 seconds",
    "startTime": "2014-05-27T11:14:26.405Z",
    "curTime": "2014-05-27T14:03:21.018Z",
    "uid": 501,
    "gid": 20,
    "values": {},
    "counters": {
        "heartbeats": 6751
    },
    "stacks": {
        "notices": [
            {
                "time": "2014-05-27T11:14:26.405Z",
                "value": "Some notice"
            },
            {
                "time": "2014-05-27T11:14:27.405Z",
                "value": "Some notice"
            },
            {
                "time": "2014-05-27T11:14:28.405Z",
                "value": "Some notice"
            }
        ]
    },
    "workers": [],
    "remoteAddress": "127.0.0.1",
    "network": {
        "lo0": [
            {
                "address": "::1",
                "family": "IPv6",
                "internal": true
            },
            {
                "address": "127.0.0.1",
                "family": "IPv4",
                "internal": true
            },
            {
                "address": "fe80::1",
                "family": "IPv6",
                "internal": true
            }
        ]
    },
    "hostname": "my-server",
    "memory": {
        "current": {
            "rss": 19996672,
            "heapTotal": 9293056,
            "heapUsed": 4609112
        },
        "initial": {
            "rss": 13086720,
            "heapTotal": 6163968,
            "heapUsed": 2152840
        },
        "diff": {
            "rss": 6909952,
            "heapTotal": 3129088,
            "heapUsed": 2456272
        }
    },
    "fallBehind": 0.966987,
    "os": {
        "type": "Darwin",
        "platform": "darwin",
        "arch": "x64",
        "release": "13.2.0",
        "uptime": 612508,
        "loadavg": [
            2.654296875,
            2.60986328125,
            2.28759765625
        ],
        "totalmem": 17179869184,
        "freemem": 5906210816
    },
    "config": {
        "name": "example-service",
        "port": 12900,
        "debug": false
    }
}
```

Given you have several processes exposing their metrics in the same manner across multitude of hosts, you
can build a central handler to aggregate their statuses or hook them up to your existing monitoring
systems.


Methods
=======

### kardia.increment(key, n);

Increment a counter by N. The counters appear in ```counters``` object on the status page. The counter gets created if it did not exist yet. Useful for, for example, analyzing execution counts of specific functions (e.g. performed 291 API PUT requests).

```javascript
kardia.increment("some counter", 2);
```


### kardia.decrement(key, n);

Decrement a counter by N.

```javascript
kardia.decrement("some counter", 2);
```

### kardia.startStack(name, length);

Start a new stack with the given name and with a given max length. In the example below, we start the "notices" stack that will be capped at 20 items at all times. You do not have to call .startStack() to start pushing values to a stack — if you pushed to a non-existing stack, the stack would automatically be generated and its length would be capped at 15 items by default.

```javascript
kardia.startStack("notices", 20);
```

### kardia.stack(name, value);

Push a new value to a stack. A stack can be pre-configured using .startStack() but does not have to be. If .stack() is called without .startStack(), the default length of the stack will be 15 items.

```javascript
kardia.stack("notices", "Some random notice");
```

### kardia.stopStack(name);

Remove a stack and any of its values.

```javascript
kardia.stopStack("notices");
```

### kardia.set(key, value);

Set a specific value to the ```values``` key-value object in the status page. Useful for, for example, connection status indications (e.g. whether a certain connection is "CONNECTED" or "CLOSED", etc).

```javascript
kardia.set("some key", "value");
```

### kardia.unset(key);

Un-set a specific key within the ```values``` block.

```javascript
kardia.unset("some key");
```

## Using with cluster module (master-worker processes)

In multi-threaded node processes where there is a master and X workers, Kardia will start the status server interface only on the master — but on the worker you can execute all commands shown above in the exact similar manner as you would on the master.

---

Licence
=======

MIT

Want to contribute?
===================

You're welcome. Please issue a pull request, and also keep an eye on the tests and the readme.

What's the name about?
======================

From Greek: kardia, meaning heart.
