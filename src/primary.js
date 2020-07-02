const { v4: uuidv4 } = require('uuid');
const axios = require('axios').default;
const express = require('express');
const path = require('path');

const TOKEN_NAME = 'x-rest-log-tokens';

function start(config) {
    let serverToken = uuidv4();

    const app = express();
    app.use('/doc', express.static('doc'));
    app.get('/', (req, res) => {
        res.redirect('/doc/swagger-ui-pri.html');
    });

    app.get('/api/hosts', (req, res) => {
        res.send({data: config.hosts});
    });

    app.get('/api/log/:filename/:lines(-?\\d+)?', (req, res) => {
        tokens = JSON.parse(req.headers[TOKEN_NAME] || "[]");

        // Check circular calls
        if(tokens.includes(serverToken)) {
            // Gretel, it seems we are walking in circles. ;)
            res.status(400).send({ error: 'Circular calls detected!' });
            return;
        }

        // Put out track
        tokens.push(serverToken);

        // build the request parameters
        let params = req.params.filename + '/';
        params += req.params.lines !== undefined ? req.params.lines : '';
        params += req.query.filters ? `?filters=${req.query.filters}` : '';

        // if no hosts are given, query all.
        let hosts = req.query.hosts ? req.query.hosts.split(',') : Object.keys(config.hosts);

        // configure axios_headers
        let axios_config = { headers: {} };
        axios_config.headers[TOKEN_NAME] = JSON.stringify(tokens);

        let requests = hosts.map((host) => {
            if(! (host in config.hosts)) {
                return Promise.reject({ message: `Host \'${host}\' not found in config.`});
            }
            return axios.get(config.hosts[host] + params, axios_config);
        });
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
    let filename = process.argv[2] ? path.resolve(process.argv[2]) :  '../config/primary_config';
    const config = require(filename);
    start(config);
}