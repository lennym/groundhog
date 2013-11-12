groundhog
=========

A tool to allow recording and playback of API responses to allow for predictable automated testing.


## Usage

```
Usage: ./bin/groundhog
Usage: node index.js

Attempts to load configuration options from a "groundhog.config.json" if it exists in the current working directory.


Usage: ./bin/groundhog --config
Usage: node index.js --config <file>

--config        load the options from a config file specified


Usage: ./bin/groundhog --hostname <hostname> --dir <directory> [--port] [--record] [--strict]
Usage: node index.js --hostname <hostname> --dir <directory> [--port] [--record] [--strict]

--hostname      host to which to proxy requests
--dir           directory in which to read/write playback files
--record        record the current session
--port          port to run on (default: 3001)
--strict        only serve recordings in playback mode
```
