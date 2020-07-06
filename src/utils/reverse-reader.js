var events = require('events');
var fs = require('fs').promises;

var ReverseReader = function() {
    this.eventEmitter = new events.EventEmitter();
}

ReverseReader.prototype.emit = function(eventName, ...args) {
    return this.eventEmitter.emit(eventName, ...args);
}


ReverseReader.prototype.on = function(eventName, listener) {
    return this.eventEmitter.on(eventName, listener);
}


ReverseReader.prototype.sendError = function(error) {
    this.emit('error', error);
}

ReverseReader.prototype.sendLine = function(line) {
    this.emit('line', line);
    process.nextTick(this.nextLine.bind(this));
}

ReverseReader.prototype.begin = function(filename) {
    this.SEPATATOR = '\n';
    this.CHUNK_SIZE = 128 * 1024;
    this.buffer = Buffer.alloc(this.CHUNK_SIZE);

    fs.open(filename, 'r')
    .then((fd) => {
        this.fd = fd;
        fs.stat(filename)
        .then((fileStat) => {
            this.running = true;
            this.chunks = Math.ceil(fileStat.size / this.CHUNK_SIZE); // how many blocks to fetch in total
            this.chunkPosition = this.chunks - 1; // the block # to be read
            this.bufferPosition = -1; // the position of the last line found

            this.updateBuffer()
            .then(() => {
                if(this.data[this.bufferPosition] === this.SEPATATOR) {
                    this.bufferPosition--;
                }
                this.nextLine();
            });
        });
    })
    .catch(this.sendError.bind(this));
}

ReverseReader.prototype.stop =  function() {
    if(this.running) {
        this.running = false;
        return this.fd.close()
        .then(() => {
            this.emit('end');
        });
    }
}

ReverseReader.prototype.updateBuffer = function() {
    if(!this.running) {
        return Promise.resolve(false);
    }
    if(this.chunkPosition < 0) {
        this.stop();
        return Promise.resolve(false);;
    }

    return this.fd.read(this.buffer, 0, this.CHUNK_SIZE, this.chunkPosition * this.CHUNK_SIZE)
    .then((result) => {
        this.data = this.buffer.slice(0, result.bytesRead).toString();
        this.bufferPosition = this.data.length - 1;
        this.chunkPosition--;
    });
}

ReverseReader.prototype.nextLine = function() {
    // bufferPosition should never be below 0,
    // because it is updated on updateBuffer()
    if((!this.running) || (this.bufferPosition < 0)) {
        return;
    }

    let end = this.bufferPosition;
    let begin = this.data.lastIndexOf(this.SEPATATOR, end);
    this.bufferPosition = begin - 1;

    let line = '';

    // if begin <= 0, we need to load the next (previous) chunk
    if(begin <= 0) {
        // It could happen that the first element is a SEPATATOR :(
        line = this.data.slice(this.data[0] === this.SEPATATOR ? 1 : 0, end+1);
        this.updateBuffer()
        .then(() => {
            if(!this.running) {
                this.sendLine(line);
                return;
            }

            if(begin < 0) {
                end = this.bufferPosition;
                begin = this.data.lastIndexOf(this.SEPATATOR, end);
                this.bufferPosition = begin - 1;
                line = this.data.slice(begin+1, end+1) + line;
            }
            this.sendLine(line);
        })
        .catch(this.sendError.bind(this));
    } else {
        line = this.data.slice(begin+1, end+1)
        this.sendLine(line);
    }
}

module.exports = ReverseReader;