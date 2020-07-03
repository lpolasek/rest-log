const path = require('path');
const express = require('express');

const ReverseReader = require('./utils/reverse-reader');

function start(config) {
    const app = express();
    app.use('/doc', express.static('doc'));
    app.get('/', (req, res) => {
        res.redirect('/doc/swagger-ui-sec.html');
    });

    app.get('/api/log/:filename/:lines(-?\\d+)?', async (req, res) => {
        let errorCodes = {
            EACCES: 403,
            ENOENT: 404
        };

        let filename = path.join(config.log_path, req.params.filename);
        let totalLines = parseInt(req.params.lines);
        let filters = req.query.filters ? req.query.filters.split(',') : [];
        let revRead = new ReverseReader();
        let count = 0;
        let logs = [];
        try {
            await revRead.init(filename);

            while(true) {
                let line = await revRead.nextLine(count === totalLines);

                if(line === null) {
                    break;
                }

                if ((filters.length > 0) && (!filters.some(filter => line.toLowerCase().includes(filter)))) {
                    continue;
                }
                logs.push(line);
                count++;
            }
            res.send({data: logs});
        } catch(error) {
            let code = errorCodes[error.code] || 400;
            res.status(code).send({error: error});
        }
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