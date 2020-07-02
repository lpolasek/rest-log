# REST Log

REST API to fetch the content of log files.

## Requirements:

* node.js (v14.x)

## Installation:

* Clone Git repository

      git clone git@github.com:lpolasek/rest-log.git

* Satisfy dependencies

      cd rest-log
      npm install

### Configuration

    cp config/primary_config.json.sample config/primary_config.json
    cp config/secondary_config.json.sample config/secondary_config.json
    cp config/multi_config.json.sample config/multi_config.json
    cp config/multi_config_circular.json.sample config/multi_config_circular.json

Edit each of the config files to fulfill your requirements.

### Testing

Test REST Log using the multi server spawner

    npm run start

then open http://127.0.0.1:3000/ in a web browser

## Development

### Design decisions

The API was designed to be very simple in its use. This explains the use of comma separated values in the *filter* and *hosts* parameters.  Another option is to put these parameters as lists in a JSON structure in the request body.

A line has to match any of the words in the filter to be added to the resulting list. Another option is to use a regular expression instead, or to model boolean operator to indicate if some words must appear simultaneously in a line (AND), or only one will suffice (OR), also a NOT operator can be added, as well as rule grouping. To do this, it will be necessary to implement an expression tree model,  parser and evaluator.

### Testing

To easy the development, some npm scripts were added, *start(:pri|:sec)?:dev*, that monitors the file changes and relaunches the application.

- `start:dev` spawns a primary, and some secondary servers. The secondary servers are attached to the primary server.
 - `start:pri:dev` starts a primary.
 - `start:sec:dev` starts a secondary server.

You can also try alternative configurations, giving the config filename as a command line parameter.

    node src/index.js config/multi_config_circular.json

All server instances, when accessed through the root URL, will bring up a *swagger-ui* page, that have the API documentation, and also has an API tester.
