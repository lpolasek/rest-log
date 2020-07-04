var fs = require('fs').promises;

var ReverseReader = function() {}

ReverseReader.prototype.init =  async function(filename) {
    this.SEPATATOR = '\n';
    this.CHUNK_SIZE = 128 * 1024;
    this.buffer = Buffer.alloc(this.CHUNK_SIZE);

    this.fd = await fs.open(filename, 'r');
    const fileStat = await fs.stat(filename);
    this.chunks = Math.ceil(fileStat.size / this.CHUNK_SIZE); // how many blocks to fetch in total
    this.chunkPosition = this.chunks - 1; // the block # to be read
    this.bufferPosition = -1; // the position of the last line found

    await this.updateBuffer();
    if(this.data[this.bufferPosition] === this.SEPATATOR) {
        this.bufferPosition--;
    }
}

ReverseReader.prototype.updateBuffer = async function() {
    if(this.chunkPosition < 0) {
        this.data = '';
        await this.fd.close();
        return;
    }
    let result = await this.fd.read(this.buffer, 0, this.CHUNK_SIZE, this.chunkPosition * this.CHUNK_SIZE);
    this.data = this.buffer.slice(0, result.bytesRead).toString();
    this.bufferPosition = this.data.length - 1;
    this.chunkPosition--;
}

ReverseReader.prototype.nextLine = async function(finish) {
    if(finish) {
        await this.fd.close();
        return null;
    }

    // bufferPosition should never be below 0,
    // because it is updated on updateBuffer()
    if(this.bufferPosition < 0) {
        return null;
    }

    let end = this.bufferPosition;
    let begin = this.data.lastIndexOf(this.SEPATATOR, end);
    this.bufferPosition = begin - 1;

    let line = '';

    // if begin <= 0, we need to load the next (previous) chunk
    if(begin <= 0) {
        // It could happen that the first element is a SEPATATOR :(
        line = this.data.slice(this.data[0] === this.SEPATATOR ? 1 : 0, end+1);
        await this.updateBuffer();
        if(this.data.length == 0 ) {
            return line;
        }

        if(begin < 0) {
            end = this.bufferPosition;
            begin = this.data.lastIndexOf(this.SEPATATOR, end);
            this.bufferPosition = begin - 1;
            line = this.data.slice(begin+1, end+1) + line;
        }
    } else {
        line = this.data.slice(begin+1, end+1);
    }

    return line;

}

module.exports = ReverseReader;