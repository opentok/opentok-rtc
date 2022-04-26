/* eslint-disable new-cap */
/* eslint-disable no-buffer-constructor */
/* eslint-disable prefer-spread */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable max-len */
const crypto = require('crypto'); // tot sign our pre-signed URL
const marshaller = require('@aws-sdk/eventstream-marshaller'); // for converting binary event stream messages to and from JSON
const util_utf8_node = require('@aws-sdk/util-utf8-node'); // utilities for encoding and decoding UTF8
const mic = require('microphone-stream'); // collect microphone input as a stream of raw bytes
const v4 = require('./aws-signature-v4'); // to generate our pre-signed URL
const audioUtils = require('./audioUtils'); // for encoding audio data as PCM

// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);

// our global variables for managing state
let languageCode;
let region;
let sampleRate;
let inputSampleRate;
let transcription = '';
let socket;
let micStream;
let socketError = false;
let transcribeException = false;

// check to see if the browser allows mic access
if (!window.navigator.mediaDevices.getUserMedia) {
  // Use our helper method to show an error on the page
  showError('We support the latest versions of Chrome, Firefox, Safari, and Edge. Update your browser and try your request again.');

  // maintain enabled/distabled state for the start and stop buttons
  toggleStartStop();
}

$('#start-button').click(() => {
  $('#error').hide(); // hide any existing errors
  toggleStartStop(true); // disable start and enable stop button

  // set the language and region from the dropdowns
  setLanguage();
  setRegion();

  // first we get the microphone input from the browser (as a promise)...
  window.navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true,
  })
  // ...then we convert the mic stream to binary event stream messages when the promise resolves
    .then(streamAudioToWebSocket)
    .catch((_error) => {
      showError('There was an error streaming your audio to Amazon Transcribe. Please try again.');
      toggleStartStop();
    });
});

let streamAudioToWebSocket = function (userMediaStream) {
  // let's get the mic input from the browser, via the microphone-stream module
  micStream = new mic();

  micStream.on('format', (data) => {
    inputSampleRate = data.sampleRate;
  });

  micStream.setStream(userMediaStream);

  // Pre-signed URLs are a way to authenticate a request (or WebSocket connection, in this case)
  // via Query Parameters. Learn more: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
  const url = createPresignedUrl();

  // open up our WebSocket connection
  socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';

  const sampleRate = 0;

  // when we get audio data from the mic, send it to the WebSocket if possible
  socket.onopen = function () {
    micStream.on('data', (rawAudioChunk) => {
      // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
      const binary = convertAudioToBinaryMessage(rawAudioChunk);

      if (socket.readyState === socket.OPEN) { socket.send(binary); }
    });
  };

  // handle messages, errors, and close events
  wireSocketEvents();
};

function setLanguage() {
  languageCode = 'en-US';
  if (languageCode === 'en-US' || languageCode === 'es-US') { sampleRate = 44100; } else { sampleRate = 8000; }
}

function setRegion() {
  region = 'us-east-1';
}

function wireSocketEvents() {
  // handle inbound messages from Amazon Transcribe
  socket.onmessage = function (message) {
    // convert the binary event stream message to JSON
    const messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
    const messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
    if (messageWrapper.headers[':message-type'].value === 'event') {
      handleEventStreamMessage(messageBody);
    } else {
      transcribeException = true;
      showError(messageBody.Message);
      toggleStartStop();
    }
  };

  socket.onerror = function () {
    socketError = true;
    showError('WebSocket connection error. Try again.');
    toggleStartStop();
  };

  socket.onclose = function (closeEvent) {
    micStream.stop();

    // the close event immediately follows the error event; only handle one.
    if (!socketError && !transcribeException) {
      if (closeEvent.code !== 1000) {
        showError(`</i><strong>Streaming Exception</strong><br>${closeEvent.reason}`);
      }
      toggleStartStop();
    }
  };
}

let handleEventStreamMessage = function (messageJson) {
  const results = messageJson.Transcript.Results;

  if (results.length > 0) {
    if (results[0].Alternatives.length > 0) {
      let transcript = results[0].Alternatives[0].Transcript;
      const time = results[0].StartTime;

      // fix encoding for accented characters
      transcript = `${decodeURIComponent(escape(transcript))}`;

      // update the textarea with the latest result
      $('#transcribe-result').val(`${transcription + transcript}\n`);

      // if this transcript segment is final, add it to the overall transcription
      if (!results[0].IsPartial) {
        // scroll the textarea down
        $('#transcribe-result').scrollTop($('#transcribe-result')[0].scrollHeight);

        transcription += `${time}: ${transcript}\n`;
      }
    }
  }
};

const closeSocket = function () {
  if (socket.readyState === socket.OPEN) {
    micStream.stop();

    // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
    const emptyMessage = getAudioEventMessage(Buffer.from(new Buffer([])));
    const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
    socket.send(emptyBuffer);
  }
};

$('#stop-button').click(() => {
  closeSocket();
  toggleStartStop();
});

$('#reset-button').click(() => {
  $('#transcript').val('');
  transcription = '';
});

function toggleStartStop(disableStart = false) {
  $('#start-button').prop('disabled', disableStart);
  $('#stop-button').attr('disabled', !disableStart);
}

function showError(message) {
  $('#error').html(`<i class="fa fa-times-circle"></i> ${message}`);
  $('#error').show();
}

function convertAudioToBinaryMessage(audioChunk) {
  const raw = mic.toRaw(audioChunk);

  if (raw == null) { return; }

  // downsample and convert the raw audio bytes to PCM
  const downsampledBuffer = audioUtils.downsampleBuffer(raw, inputSampleRate, sampleRate);
  const pcmEncodedBuffer = audioUtils.pcmEncode(downsampledBuffer);

  // add the right JSON headers and structure to the message
  const audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

  // convert the JSON object + headers into a binary event stream message
  const binary = eventStreamMarshaller.marshall(audioEventMessage);

  return binary;
}

function getAudioEventMessage(buffer) {
  // wrap the audio data in a JSON envelope
  return {
    headers: {
      ':message-type': {
        type: 'string',
        value: 'event',
      },
      ':event-type': {
        type: 'string',
        value: 'AudioEvent',
      },
    },
    body: buffer,
  };
}

function createPresignedUrl() {
  const endpoint = 'transcribestreaming.us-east-1.amazonaws.com:8443';

  // get a preauthenticated URL that we can use to establish our WebSocket
  return v4.createPresignedURL(
    'GET',
    endpoint,
    '/stream-transcription-websocket',
    'transcribe',
    crypto.createHash('sha256').update('', 'utf8').digest('hex'), {
      key: AMAZON_KEY,
      secret: AMAZON_SECRET,
      sessionToken: '',
      protocol: 'wss',
      expires: 15,
      region,
      query: 'language-code=en-US&media-encoding=pcm&sample-rate=44100',
    },
  );
}
