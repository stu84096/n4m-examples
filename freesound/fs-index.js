// Simple wrapper for the giphy API, which lets you download giphy gifs to Max

// Begin loading modules

const Max = require('max-api');

let dotenv_module;
try {
    dotenv_module = require('dotenv');
    dotenv_module.config();
} catch (e) {
    Max.post(e, "ERROR");
    Max.post("Could not load the dotenv module. Please be sure to send the message 'script npm install' to the node.script object to download node modules", "ERROR");
    process.exit(1);
}

if (!process.env.FREESOUND_CLIENT_KEY) {
    Max.post("No value for key FREESOUND_CLIENT_KEY in .env file. Please make sure to create a file called .env with a Freesound API Client key.", "ERROR");
    process.exit(1);
}

if (!process.env.FREESOUND_CLIENT_SECRET) {
    Max.post("No value for key FREESOUND_CLIENT_SECRET in .env file. Please make sure to create a file called .env with a Freesound API Client Secret.", "ERROR");
    process.exit(1);
}

const freesound = require('freesound');
freesound.setClientSecrets(process.env.FREESOUND_CLIENT_KEY, process.env.FREESOUND_CLIENT_SECRET);

const fs = require('fs');
const http = require('http');
const tmp = require('tmp');

// Declare handlers

Max.addHandlers({
    search: (query) => {
        const fields = 'id,name,url,previews';
        const page = 1;
        const filter = encodeURIComponent("duration:[0.0 TO 1.5]");
        const sort = "rating_desc";
        const token = process.env.FREESOUND_CLIENT_SECRET;
        freesound.textSearch(query, { page, filter, sort, fields, token }, (response) => {
            const results = response.results;
            const count = results.length;
            const idx = Math.floor(Math.random() * count);
            const result = results[idx];
            const sndurl = result.previews["preview-hq-mp3"];
            saveToTemporaryFile(sndurl, ".mp3", path => {
                Max.outlet([query, path]);
            }, err => {
                Max.post(err, "ERROR");
            });
        }, (err) => {
            Max.post(err);
        });
    }
});

function saveToTemporaryFile(url, extension, onSuccess, onErr) {
    tmp.file({postfix: `-${extension}`}, (err, path, fd, cleanup) => {
        if (err) {
            onErr(err);
            return;
        }
        const writeStream = fs.createWriteStream(path);
        const readRequest = http.request(url, (res) => {
            res.on("data", data => writeStream.write(data));
            res.on("end", () => {
                writeStream.close();
                onSuccess(path);
            });
            res.on("error", err => { onErr(err) });
        });
        readRequest.end();
    });
}