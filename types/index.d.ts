/**
 * Type definitions for kardia 0.10.1
 * Project: https://github.com/pipedrive/kardia
 * Definitions by: Marco Talento
 *
 * Example:
 *
 * import * as Kardia from 'kardia'
 *
 * Kardia.start({ name: "My process", host: '0.0.0.0', port: 12900 });
 */

declare module "kardia" {
    import { NetworkInterfaceInfo } from "os";
    import { ServerRequest } from "http";

    interface HealthCheckOptions {
        timeout: number,
        handler: () => void;
    }

    interface Configuration {
        name: string;
        host?: string;
        port?: number;
    }

    interface Status {
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
        network: { [index: string]: NetworkInterfaceInfo[] };
        hostname: string;
        memory: string;
        fallBehind: number;
        os: {
            type: string;
            platform: NodeJS.Platform;
            arch: string;
            release: string;
            uptime: number;
            loadavg: number[];
            totalmem: number;
            freemem: number;

        };
        config: Configuration;
    }

    export function start(config: Configuration): void;

    /**
     * Increment a counter by N. The counters appear in counters object on the status page. The counter gets created if it did not exist yet. Useful for, for example, analyzing execution counts of specific functions (e.g. performed 291 API PUT requests).
     * @param key key
     * @param n value to increment
     */
    export function increment(key: string, n: number): void;

    /**
     * Decrement a counter by N.
     * @param key Key
     * @param n value to decrement
     */
    export function decrement(key: string, n: number): void;

    /**
     * Start a new stack with the given name and with a given max length. In the example below, we start the "notices" stack that will be capped at 20 items at all times. You do not have to call .startStack() to start pushing values to a stack — if you pushed to a non-existing stack, the stack would automatically be generated and its length would be capped at 15 items by default.
     * @param name Name of the stack
     * @param length Lenght of the stack
     */
    export function startStack(name: string, length: number): void;

    /**
     * Push a new value to a stack. A stack can be pre-configured using .startStack() but does not have to be. If .stack() is called without .startStack(), the default length of the stack will be 15 items.
     * @param name Name of the stack
     * @param value Value
     */
    export function stack(name: string, value: string): void;

    /**
     * Remove a stack and any of its values.
     * @param name Name of the stack
     */
    export function stopStack(name: string): void;

    /**
     * Set a specific value to the values key-value object in the status page. Useful for, for example, connection status indications (e.g. whether a certain connection is "CONNECTED" or "CLOSED", etc).
     * @param name Name of the key
     * @param value Value of the key
     */
    export function set(name: string, value: any): void;

    /**
     * Un-set a specific key within the values block.
     * @param name Name of the key
     */
    export function unset(name: string): void;

    /**
     * Increment a throughput counter with the given name. The throughput will get automatically calculated per second, per minute and per hour, and will appear in throughput object on the status page. Any new names will trigger automatic creation of the given throughput counter.
     * @param name Name of the throughput counter.
     */
    export function throughput(name: string): void;

    /**
     * Increment a throughput counter with the given name. The throughput will get automatically calculated per second, per minute and per hour, and will appear in throughput object on the status page. Any new names will trigger automatic creation of the given throughput counter.
     * @param name Name of the throughput counter.
     */
    export function clearThroughput(name: string): void;

    /**
     * Register a new health check handler function. (Read: https://github.com/pipedrive/kardia#kardiaregisterhealthcheck-handler-function-timeout-integer)
     * @param options Healthcheck options.
     */
    export function registerHealthcheck(options: HealthCheckOptions): void;

    /**
     * Return process status information (memory, os, network, etc...)
     * @param request 
     */
    export function generateStatus(request?: ServerRequest): Status;
}

