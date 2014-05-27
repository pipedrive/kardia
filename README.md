Kardia
======

A humane process status API interface to expose Node.js process status operational/internal indicators for aggregation and monitoring. JSON format over HTTP protocol.

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

Then, Kardia will create a new HTTP server on the designated port (default 12900) which lists the indicators
of the running process in JSON format, here's an example:
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


When you're using Node.js cluster with multiple worker processes, it is intended that Kardia is used on the
master process, and all workers can ping their update/change requests about Kardia data to the master
process.


Methods
=======

### kardia.increment("some counter", 2);

Increment a counter. The counter gets created if it did not exist yet. Useful for analyzing execution cycles
of specific functionality.

### kardia.set("some key", "some value");

Set a specific value to the status page. Useful for connection status indications.

Licence
=======

MIT.
