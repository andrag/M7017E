/**
 * Created by Anders on 2016-01-25.
 */
'use strict';

var mediaSource = new MediaSource();
var getAudio = true;
var getVideo = true;

//Decide the constraints, what media to capture
var constraints = {
    audio: getAudio,
    video: getVideo
};

var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

//Html elements
var webcamVideo = document.querySelector('video#webcam');
var recordedVideo = document.querySelector('video#recorded');

var recordButton = document.querySelector('button#recordbutton');
var playButton = document.querySelector('button#playbutton');
var downloadButton = document.querySelector('button#downloadbutton');


//Check if run from localhost or server is secure.
var isSecure = location.host === 'localhost' || location.protocol === 'https';
if(!isSecure){
    alert('You are not running HTTPS or from localhost. Changing to HTTPS.');
    //location.protocol = 'HTTPS';
}


//Prompt for the camera and/or mic
navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

//SSL check goes here

//Get the stream from the webcam and mic or report an error.
navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        console.log('getUserMedia() got stream: ', stream);
        window.stream = stream;
        webcamVideo.srcObject = stream;
    }).catch(function(error){
    console.log('navigator.getUserMedia error: ', error);
});


mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
recordButton.onclick = toggleRecording;//If () here the functions run automatically.
playButton.onclick = play;
downloadButton.onclick = download;


//--------------------------------Methods for recording-----------------------------------------

function toggleRecording(){
    if (recordButton.textContent === 'Record') {
        startRecording();
    } else {
        stopRecording();
        recordButton.textContent = 'Record';
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
}

function startRecording() {
    try {
        recordedBlobs = [];
        mediaRecorder = new MediaRecorder(window.stream /* ,video '/vp8' */);//What is the second arg?
    } catch (event) {
        alert('MediaRecorder not supported in this browser.');
        console.error('MediaRecorder exception: ', event);
        return;
    }

    console.assert(mediaRecorder.state === 'inactive'); //assert writes an error message to the console if the assertion is false.
    recordButton.textContent = 'Stop';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onStop = handleStop;//Just for logging the stop
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(); //Start recording the stream into a blob object
    console.log('MediaRecorder started', mediaRecorder);
    console.assert(mediaRecorder.state === 'recording');
}

function stopRecording() {
    mediaRecorder.stop();
    console.log('Recorded Blobs: ', recordedBlobs);
    recordedVideo.controls = true; //Displays video controls for the recorded element
}

//------------------------------------Play and download--------------------------

function play() {

    var superBuffer = new Blob(recordedBlobs);
    //Firefox is not ready for buffer src objects yet
    //Set the source of the recorded video to a DOM-string representation of the superBuffer
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
}

function download() {
    var blob = new Blob(recordedBlobs, {type: 'video/webm'});//Change and add file filter
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}


//----------------------------Handler functions----------------------------------

/* HandleSourceOpen is called from the success callback method of the method above.
 This method creates a new source buffer of a given MIME type and adds it
 to the MediaSource's SourceBuffers list.
 */
function handleSourceOpen(event){
    console.log('MediaSource opened');
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
    console.log('Source buffer: ', sourceBuffer);
}

function handleStop(event){
    console.log('Recorder stopped: ', event);
}


function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);//Add the recorded data to the blob
        console.assert(mediaRecorder.state === 'recording',
            'State should be "recording"');
    } else {
        console.assert(mediaRecorder.state === 'inactive',
            'State should be "inactive"');
    }
}