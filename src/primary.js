const axios = require('axios').default;
const express = require('express');

function start(config) {
    const app = express();
    app.use('/doc', express.static('doc'));
    app.get('/', (req, res) => {
        res.redirect('/doc/swagger-ui-pri.html');
    });

    app.get('/api/hosts', (req, res) => {
        res.send({data: config.hosts});
    });

    app.get('/api/log/:filename/:lines(-?\\d+)?', (req, res) => {
        // build the request parameters
        let params = req.params.filename + '/';
        params += req.params.lines !== undefined ? req.params.lines : '';
        params += req.query.filters ? `?filters=${req.query.filters}` : '';

        // if no hosts are given, query all.
        let hosts = req.query.hosts ? req.query.hosts.split(',') : Object.keys(config.hosts);

        let requests = hosts.map(host => axios.get(config.hosts[host] + params));
        Promise.allSettled(requests)
        .then((results) => {
            let data = {};
            results.forEach((result, index) => {
                data[hosts[index]] = result.status === 'fulfilled' ?
                    result.value.data :
                    { error: result.reason.message };
            });
            res.send({data: data});
        });
    });

    app.use(function(req, res) {
        res.status(404).send({ error: 'Not Found' });
    });

    app.listen(config.port, () => {
        console.log(`Server "${config.name}" listening on port ${config.port}!`)
    });
}
module.exports = start;

if (require.main === module) {
    const config = require('../config/primary_config');
    start(config);
}