const path = require('path');
const express = require('express');

const processFile = require('./utils/process-file');

function start(config) {
    const app = express();
    app.use('/doc', express.static('doc'));
    app.get('/', (req, res) => {
        res.redirect('/doc/swagger-ui-sec.html');
    });

    app.get('/api/log/:filename/:lines(-?\\d+)?', (req, res) => {
        let errorCodes = {
            EACCES: 403,
            ENOENT: 404
        };

        let filename = path.join(config.log_path, req.params.filename);
        let filters = req.query.filters ? req.query.filters.split(',') : [];
        processFile(filename, parseInt(req.params.lines), filters)
        .then((logs) => res.send({data: logs}))
        .catch((error) => {
            let code = errorCodes[error.code] || 400;
            res.status(code).send({error: error});
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
    let filename = process.argv[2] ? path.resolve(process.argv[2]) :  '../config/secondary_config';
    const config = require(filename);
    start(config);
}