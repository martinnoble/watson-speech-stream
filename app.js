var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');

var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
//var fs = require('fs');
//var ts = require('tailing-stream');
//var gf = require('growing-file');

var speech_to_text = new SpeechToTextV1 ({
  username: 'aea0cb7f-cf30-480a-bf42-f0f79e415101',
  password: '3vqJNwm6STIK'
});

var params = {
  model: 'en-UK_BroadbandModel',
  content_type: 'audio/l16; rate=48000',
  continuous: true,
  'interim_results': true,
  'max_alternatives': 3,
  'word_confidence': false,
  timestamps: false,
  keywords: ['colorado', 'tornado', 'tornadoes'],
  'keywords_threshold': 0.5
};




var port = 3700;
var outFile = 'demo.wav';
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

app.listen(port);

console.log('server open on port ' + port);

binaryServer = BinaryServer({port: 9001});

binaryServer.on('connection', function(client) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 48000,
    bitDepth: 16
  });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
 
    // Create the stream.
    var recognizeStream = speech_to_text.createRecognizeStream(params);

    stream.pipe(recognizeStream);
    recognizeStream.pipe(fs.createWriteStream('transcription.txt'));
    recognizeStream.setEncoding('utf8');

    recognizeStream.on('results', function(event) { onEvent('Results:', event); });
    recognizeStream.on('data', function(event) { onEvent('Data:', event); });
    recognizeStream.on('error', function(event) { onEvent('Error:', event); });
    recognizeStream.on('close', function(event) { onEvent('Close:', event); });
    recognizeStream.on('speaker_labels', function(event) { onEvent('Speaker_Labels:', event); });

    stream.pipe(fileWriter);

    stream.on('end', function() {
      fileWriter.end();
      console.log('wrote to file ' + outFile);
    });

    
  });
});



// Displays events on the console.
function onEvent(name, event) {
  console.log(name, JSON.stringify(event, null, 2));
};

