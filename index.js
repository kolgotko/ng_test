#!/usr/bin/env node

const jsonQuery = require('json-query');
const randomMac = require('random-mac');
const { spawnSync, spawn } = require('child_process');

let eth = '';

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

    console.log(ethIfo);

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

spawnSync('ifconfig', [
    eth,
    'delete'
]);


for (let i = 3; i < 4; i++) {

    spawnSync('ngctl', [
        'mkpeer',
        'switch:',
        'eiface',
        `link${i}`,
        'ether',
    ]);

    let newEthInfo = spawnSync('ngctl', [
        'show',
        '-n',
        `switch:link${i}`,
    ]).stdout.toString();

    console.log(newEthInfo);

    let newEth = newEthInfo.match(/Name\:\s*(\w+)\s/);
    newEth = newEth[1];

    spawnSync('ifconfig', [
        newEth,
        'ether',
        randomMac(),
        'up',
    ]);

    spawn('dhclient', [
        newEth,
    ]);

}

