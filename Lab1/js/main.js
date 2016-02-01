
'use strict';

var mediaSource = new MediaSource();
var getAudio = true;
var getVideo = true;

//Constraints, what media to capture
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


//OnClickListeners
recordButton.onclick = toggleRec;
playButton.onclick = play;
downloadButton.onclick = download;



//-------------------------------------Functions for getting the local media stream-------------------------------------

//Use the right version of getUserMedia API depending on the browser used
navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


//Prompt for permission to use webcam and/or mic depending on the constraints set above
navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        console.log('getUserMedia() got stream: ', stream);
        window.stream = stream;
        webcamVideo.srcObject = stream;
    }).catch(function(error){
    console.log('navigator.getUserMedia error: ', error);
});


//Event listener for handling the source when opened
mediaSource.addEventListener('sourceopen', onSourceOpen, false);


/*  SuccesCallback of the mediaSource eventListener.
    Creates and adds a sourcebuffer of given MIME type to MediaSource.
 */
function onSourceOpen(event){
    console.log('MediaSource is open');
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');//Set MIME type
    console.log('Source buffer: ', sourceBuffer);
}



//--------------------------------Functions for recording-----------------------------------------


/* Toggles the text of the record button between 'Record' and 'Stop'
    Calls startRec or stopRec depending on this text.
 */
function toggleRec(){
    if(recordButton.textContent === 'Record'){
        recordButton.textContent = 'Stop';
        playButton.disabled = true;
        downloadButton.disabled = true;
        startRec();
    }
    else{
        stopRec();
        recordButton.textContent = 'Record';
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
}

/*  Initiates the mediaRecorder with the stream and starts it.
    Sets functions for stop events and handling the recorded data.
 */
function startRec(){
    try {
        recordedBlobs = [];
        mediaRecorder = new MediaRecorder(window.stream);
    } catch (event) {
        alert('MediaRecorder not supported in this browser.');
        console.error('MediaRecorder exception: ', event);
        return;
    }
    console.assert(mediaRecorder.state === 'inactivatae'); //Check if the media recorder is in the right state
    mediaRecorder.onStop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
    console.assert(mediaRecorder.state === 'recording');
}

function handleStop(event){
    console.log('MediaRecorder stopped: ', event);
}


//Push the recorded data to the recordedBlobs array
function handleDataAvailable(event){
    if(event.data && event.data.size > 0) {
        recordedBlobs.push(event.data)
        console.assert(mediaRecorder.state === 'recording', 'MediaRecorder state should be recording.');
    }
    else{
        console.assert(mediaRecorder.state === 'inactive', 'MediaRecorder state should be inactive.');
    }
}


function stopRec(){
    mediaRecorder.stop();
    recordedVideo.controls = true;
    console.log('Recorded blobs: ', recordedBlobs);
}





//------------------------------------Functions for playback and download--------------------------

/** Creates a buffer and sets it as source for the recordedVideo HTML element.
 *  The element is fed a URL object made from the blob buffer since FireFox cannot handle buffer objects ad source yet.
 */
function play() {
    var recordedVideoBuffer = new Blob(recordedBlobs);
    recordedVideo.src = window.URL.createObjectURL(recordedVideoBuffer);
}


/** This function creates a Blob with specified MIME type: webm format video.
 *  A uri object is created from the blob and appended as a new invisible HTML element set
 *  to be downloaded with the name recorded_video.webm. The temporary HTML element is removed
 *  after a timeout set to 100 ms.
 */
function download() {
    var blob = new Blob(recordedBlobs, {type: 'video/webm'});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a'); //Create a hyperlink
    a.style.display = 'none';
    a.href = url;
    a.download = 'recorded_video.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}


