const primary = require('./primary');
const secondary = require('./secondary');
const config = require('../config/multi_config');

let sec_hosts = {};

config.secondary.forEach((sec_conf) => {
    sec_hosts[sec_conf.name] = `http://127.0.0.1:${sec_conf.port}/api/log/`;
    secondary(sec_conf);
});

config.primary.forEach((pri_conf) => {
    pri_conf.hosts = sec_hosts;
    primary(pri_conf);
});
