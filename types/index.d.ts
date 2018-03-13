/**
 * Type definitions for kardia 0.11.0
 * Project: https://github.com/pipedrive/kardia
 * Definitions by: Marco Talento
 * Dependencies: npm install @types/node
 * Example:
 *
 * import * as Kardia from 'kardia'
 *
 * const kardia = Kardia.start({ name: "My process", host: '0.0.0.0', port: 12900 });
 * const statusInfo = kardia.generateStatus();
 */

import { ServerRequest, ServerResponse } from "http";

declare namespace kardia {
	/**
	 * Status Configuration
	 */
    interface Configuration {
        name: string;
        host?: string;
        port?: number;
        debug?: boolean;
        healthcheck?: (cb?: Function) => void;
    }

	/**
	 * Health Check Options
	 */
    interface HealthCheckOptions {
        timeout?: number,
        handler: Function;
    }

	/**
	 * Process Info
	 */
    interface StatusInfo {
        service: string;
        pid: number;
        env: string;
        uptime: number;
        uptime_formatted: string;
        startTime: string;
        curTime: string;
        uid?: number;
        gid?: number;
        values: any;
        counters: any;
        throughput: any;
        stacks: any;
        workers: any;
        remoteAddress: boolean;
        network: { [index: string]: string[] };
        hostname: string;
        memory: string;
        fallBehind: number;
        os: {
            type: string;
            platform: string;
            arch: string;
            release: string;
            uptime: number;
            loadavg: number[];
            totalmem: number;
            freemem: number;

        };
        config: Configuration;
    }

	/**
	 * Consul Parameters
	 */
    interface ConsulParams {
        interval: string;
        notes: string;
        http: string;
        service_id: string;
    }

    /** Kardia Worker */
    interface Worker {
        pid: number;
        id: number;
        startTime: Date;
        values: { [name: string]: any };
        counters: { [name: string]: any };
        stacks: { [name: string]: any };
        stackConfig: { [name: string]: { size: number } };
        throughputs: any;
        throughputsBuffer: { [name: string]: number };
        eventListeners: { [name: string]: Function };
        startMemory: { rss: number; heapTotal: number; heapUsed: number; }
        fallBehind: number;
        config: Configuration;

		/**
		 *  Increment a counter by N. The counters appear in counters object on the status page. The counter gets created if it did not exist yet. Useful for, for example, analyzing execution counts of specific functions (e.g. performed 291 API PUT requests).
			* @param key key
			* @param n value to increment
		 */
        increment(key: string, n: number): void;

		/**
		 * Decrement a counter by N.
		 * @param key Key
		 * @param n value to decrement
		 */
        decrement(key: string, n: number): void;

		/**
		 * Reset the value with the given key.
		 * @param name Name of the key
		 */
        reset(name: string): void;

		/**
		 * Start a new stack with the given name and with a given max length. In the example below, we start the "notices" stack that will be capped at 20 items at all times. You do not have to call .startStack() to start pushing values to a stack — if you pushed to a non-existing stack, the stack would automatically be generated and its length would be capped at 15 items by default.
		 * @param name Name of the stack
		 * @param length Lenght of the stack
		 */
        startStack(name: string, length: number): void;

		/**
		 * Push a new value to a stack. A stack can be pre-configured using .startStack() but does not have to be. If .stack() is called without .startStack(), the default length of the stack will be 15 items.
		 * @param name Name of the stack
		 * @param value Value
		 */
        stack(name: string, value: string): void;

		/**
		 * Remove a stack and any of its values.
		 * @param name Name of the stack
		 */
        stopStack(name: string): void;

		/**
		 * Set a specific value to the values key-value object in the status page. Useful for, for example, connection status indications (e.g. whether a certain connection is "CONNECTED" or "CLOSED", etc).
		 * @param name Name of the key
		 * @param value Value of the key
		 */
        set(name: string, value: any): void;

		/**
		 * Un-set a specific key within the values block.
		 * @param name Name of the key
		 */
        unset(name: string): void;

		/**
		 * Increment a throughput counter with the given name. The throughput will get automatically calculated per second, per minute and per hour, and will appear in throughput object on the status page. Any new names will trigger automatic creation of the given throughput counter.
		 * @param name Name of the throughput counter.
		 */
        throughput(name: string): void;

		/**
		 * Increment a throughput counter with the given name. The throughput will get automatically calculated per second, per minute and per hour, and will appear in throughput object on the status page. Any new names will trigger automatic creation of the given throughput counter.
		 * @param name Name of the throughput counter.
		 */
        clearThroughput(name: string): void;

		/**
		 * Return process status information (memory, os, network, etc...)
		 * @param request
		 */
        generateStatus(request?: ServerRequest): StatusInfo;
    }

	/**
	 * Kardia Status
	 */
    interface Status extends Worker {
        healthcheck: Function;
        healthcheckTimeout: number;
        workers: { [pid: number]: Worker };

		/**
		 * Register a new health check handler function. (Read: https://github.com/pipedrive/kardia#kardiaregisterhealthcheck-handler-function-timeout-integer)
		 * @param options Healthcheck options.
		 */
        registerHealthcheck(options: HealthCheckOptions | Function): void;

		/**
		 * Add a worker to the main kardia status
		 * @param worker worker child to add
		 */
        addWorker(worker: Worker): Worker

		/**
		 * Remove a worker by process id
		 * @param pid process id of the worker child
		 */
        removeWorker(pid: number): void;

		/**
		 * Start internal HttpServer that exposes the process Metrics
		 */
        startServer(): void;

		/**
		 * Stops the internal HttpServer
		 */
        stopServer(): void;

		/**
		 * Start a new instance of Kardia
		 * @param config Kardia Configuration
		 */
        start(config: Configuration): Status;

		/**
		 * Get Consul Parameters
		 * @param options Optional parameters
		 */
        getConsulHealthcheck(options: { interval?: string, notes?: string, service_id?: string }): ConsulParams;

		/**
		 * Set the server handler
		 * @param req Server Request
		 * @param res Server Response
		 */
        serveStatusRequest(req: ServerRequest, res: ServerResponse): void;

		/**
		 * Set the Healthcheck handler (/health)
		 * @param req Server Request
		 * @param res Server Response
		 */
        serveHealthcheckRequest(req: ServerRequest, res: ServerResponse): void;

		/**
		 * Registers endpoint name with output
		 * @param name Endpoint name. (eg. /endpoint-example)
		 * @param output Output
		 */
        registerEndpoint(name: string, output: string | Function): void;
    }
}

declare const kardia: kardia.Status;
export = kardia;
