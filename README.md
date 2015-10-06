# Kardia

A humane service status and health check API module to expose any operational/internals of any Node.js based microservice. JSON format over HTTP protocol. Field tested in production at scale. Perfect for further aggregation and consumption from a larger set of services that all expose their internals using the Kardia interface.

[![NPM version](https://badge.fury.io/js/kardia.svg)](http://badge.fury.io/js/kardia) [![Build status](https://travis-ci.org/pipedrive/kardia.svg)](https://travis-ci.org/pipedrive/kardia) [![Coverage Status](https://coveralls.io/repos/pipedrive/kardia/badge.svg?branch=code_coverage&service=github)](https://coveralls.io/github/pipedrive/kardia?branch=code_coverage)


## Why?

When running several Node.js based microservices across large number of hosts/containers like we do here at Pipedrive, we discovered it becomes increasingly difficult to monitor the state of different internal variables inside these processes.

To address this, we created a common status API interface which we consume and analyze centrally, with all Node.js services on all hosts exposing their internal status using Kardia format.

* A common interface (JSON over HTTP) that can be consumed in a ton of different ways
* Human-readable out of the box
* Unified health check endpoint registration (```/health```)
* Use the same way across master and worker processes (all workers' statuses get aggregated to master for output automatically)

## Methods

 * [kardia.increment(key, n);](#kardiaincrementkey-n)
 * [kardia.decrement(key, n);](#kardiadecrementkey-n)
 * [kardia.startStack(name, length);](#kardiastartstackname-length)
 * [kardia.stack(name, value);](#kardiastackname-value)
 * [kardia.stopStack(name);](#kardiastopstackname)
 * [kardia.set(key, value);](#kardiasetkey-value)
 * [kardia.unset(key);](#kardiaunsetkey)
 * [kardia.throughput(name);](#kardiathroughputname)
 * [kardia.clearThroughput(name);](#kardiaclearthroughputname)
 * [kardia.registerHealthcheck({ handler: (function), timeout: (integer)});](#kardiaregisterhealthcheck-handler-function-timeout-integer)

## Usage

```
npm install kardia
```

In your code to start Kardia:

```javascript
var Kardia = require('kardia');
var kardia = Kardia.start({ name: "My process", host: '0.0.0.0', port: 12900 });
```

Then, when run on the master process, Kardia will create a new HTTP server on the designated host (default 0.0.0.0) and port (default 12900) which lists the indicators of the running process in JSON format. On the worker process (using Node.js's cluster module), it will expose the same interface and start collecting data which it sends back to the master process automatically using IPC to be displayed with the Kardia HTTP server along with data from the master and all worker processes.

Kardia server will be a singleton, accessible from every file in the master process. So all subsequent calls to Kardia can be to obtain the reference to the running server with the following syntax from any file:

```javascript
var kardia = require('kardia');
```

Also, when used in the [master-worker cluster](examples/cluster), you can use the exact same syntax as shown above from any worker process.

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
 * **throughput** — key-value container for any user-defined throughput measures using ```kardia.throughput()```
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
    "throughput": {
        "incoming requests from customers": {
            "sec": 51.23,
            "min": 3073.8,
            "hour": 184428
        },
        "outbound requests to billing service": {
            "sec": 51.23,
            "min": 3073.8,
            "hour": 184428
        }
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


## Methods

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

### kardia.throughput(name);

Increment a throughput counter with the given ```name```. The throughput will get automatically calculated per second, per minute and per hour, and will appear in ```throughput``` object on the status page. Any new names will trigger automatic creation of the given throughput counter.

```javascript
kardia.throughput("incoming requests from customers");
```

### kardia.clearThroughput(name);

Clear the throughput counter with the given ```name```.

```javascript
kardia.throughput("incoming requests from customers");
```

### kardia.registerHealthcheck({ handler: (function), timeout: (integer)});

Register a new health check handler function.

After registering, the function you supplied will get called when an HTTP request is made against ```/health``` with a callback function as the first argument, and the current Kardia status output data as the second argument (so you can build checks around specific counters or variables from that, based on the exact need). Your application can then fulfill a meaningful health check and fire the supplied callback with a boolean ```true``` as the first argument (in case the service should be considered healthy), or an Error object (in case any error occurred and the service should be considered unhealthy).

When master-worker or otherwise multithreading is being used, it is intended that the health check be registered with the master process, as any worker process status data gets passed down to it within the callback arguments. Definitely check the [master-worker cluster example](examples/cluster).

Note that if the callback is not called within 15 seconds, Kardia will assume the service has become unresponsive. This timeout can be customized by calling the registerHealthcheck method using the latter example.

The recommended integration path of /check is that when any other HTTP code than 200 is received, the service should be considered unhealthy from a monitoring standpoint.

Health check registration example using a timeout of 5 seconds:
```javascript
kardia.registerHealthcheck({
    handler: function(callback, currentStatus) {
        // do some health check logic here.
        if (allOk) {
            callback();
        } else {
            callback(err);
        }
    },
    timeout: 5
});
```

Or alternatively:

```javascript
kardia.registerHealthcheck(function(callback, currentStatus) {
    // do some health check logic here.
    if (allOk) {
        callback();
    } else {
        callback(err);
    }
}
```

#### Built-in Consul health check integration

Kardia's health check handler mechanism can be easily used with various monitoring tools, such as [Consul](https://www.consul.io/docs/agent/checks.html). Furthermore, Kardia comes with a designated method (`kardia.getConsulHealthcheck()`) for obtaining the health check details for direct Consul integration, using the [consul-node](https://github.com/silas/node-consul#consulagentserviceregisteroptions-callback) npm module.


Consul integration example (using [consul-node]() npm module):
```javascript
consul.agent.service.register({ name: "my-service", check: kardia.getConsulHealthcheck() }, function(err) {
  if (err) throw err;
});
```

## Using Kardia with node's cluster module (master-worker processes)

In multi-threaded node processes where there is a master and X workers, Kardia will start the status server interface only on the master — but on the worker you can execute all commands shown above in the exact similar manner as you would on the master.

---

## Licence

MIT

## Want to contribute?

You're welcome! Please issue a pull request, and also keep an eye on updating the tests and the readme.

## What's the name about?

From Greek: kardia, meaning heart.
