#!/usr/bin/env node

const eth = 'wlan0';
const jsonQuery = require('json-query');
const { spawnSync } = require('child_process');

if (!eth) {

    let out = spawnSync('netstat', [
        '-r',
        '--libxo',
        'json',
    ]).stdout.toString();

    out = JSON.parse(out);
    out = out.statistics['route-information']['route-table']['rt-family'];

    let ethIfo = jsonQuery(
        '[address-family=Internet].rt-entry[destination=default]',
        { data: out }
    ).value;

    eth = ethIfo['interface-name'];

}


spawnSync('ngctl', [
    'msg',
    `${eth}:`,
    'setpromisc',
    '1',
]);

spawnSync('ngctl', [
    'msg',
    `${eth}:`,
    'setautosrc',
    '0',
]);

spawnSync('ngctl', [
    'mkpeer',
    `${eth}:`,
    'bridge',
    'lower',
    'link0',
]);

spawnSync('ngctl', [
    'name',
    `${eth}:lower`,
    'switch',
]);

spawnSync('ngctl', [
    'connect',
    `${eth}:`,
    'switch:',
    'upper',
    'link1',
]);

spawnSync('ngctl', [
    'mkpeer',
    'switch:',
    'eiface',
    'link2',
    'ether',
]);

spawnSync('ifconfig', [
    eth,
    'delete'
]);

spawnSync('ifconfig', [
    'ngeth0',
    'up',
]);

spawnSync('dhclient', [
    'ngeth0',
]);

