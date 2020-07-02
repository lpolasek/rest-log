const path = require('path');

const primary = require('./primary');
const secondary = require('./secondary');

let filename = process.argv[2] ? path.resolve(process.argv[2]) :  '../config/multi_config';
const config = require(filename);

let sec_hosts = {};

config.secondary.forEach((sec_conf) => {
    sec_hosts[sec_conf.name] = `http://127.0.0.1:${sec_conf.port}/api/log/`;
    secondary(sec_conf);
});

config.primary.forEach((pri_conf) => {
    pri_conf.hosts = { ...pri_conf.hosts, ...sec_hosts };
    primary(pri_conf);
});
