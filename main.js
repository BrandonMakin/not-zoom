const constraints = {
  audio: true,
  video: { width: 1280, height: 720 }
}
const RTCConfiguration = {iceServers: [{urls: 'stun:stun2.l.google.com:19302'}]};

let peerConnection = new RTCPeerConnection(RTCConfiguration);

///////////////////////////////////////////////////////////////////////
/// Get user video and audio
const remoteVideo = document.querySelector('#otherVideo');

function handleSuccess(stream) {
  // show your own video on your screen
  const video = document.querySelector('#myVideo');
  video.srcObject = stream;
  // add the video to the peerConnection
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });
}

async function init(event) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    event.target.disabled = true;

  }
  catch (e) {
    console.log("Error!");
    console.log(e)
  }
}

document.querySelector('#start').addEventListener('click', e => init(e));

//---------------------------------------------------------------------
// set up the WebSocket to talk to the signalling server
//---------------------------------------------------------------------
let prefix = "ws://"
let url = "ec2-35-164-249-232.us-west-2.compute.amazonaws.com";
let port = 1337;
let socket = new WebSocket(prefix + url + ":" + port);

//---------------------------------------------------------------------
// socket.onmessage: called when we get a message from the server
//---------------------------------------------------------------------
socket.onmessage = async function(event) {
  let data = JSON.parse(event.data);
  // called every time the client gets a message from the server
  if (data.description) {
    console.log("Setting description. (" + data.description.type + ")")
    // if we get an offer
    if (data.description.type == 'offer') {
      // set remote description based on what we received
      await peerConnection.setRemoteDescription(data.description);
      // generate and set a local description by creating an answer.
      let answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      // respond to the offer by sending our answer that we just generated.
      send({description: peerConnection.localDescription});
    }
    // if we get an answer
    else if (data.description.type == 'answer') {
      // save the remote description that we just got.
      // at this point, each peer has both a remote description and a local description saved.
      await peerConnection.setRemoteDescription(data.description);
    }
  }
  else if (data.candidate) {
    // tell the peerConnection about the new ICE candidate
    await peerConnection.addIceCandidate(data.candidate);
  }
}

//---------------------------------------------------------------------
// send: makes it easy to send objects to the WebSocket server
//---------------------------------------------------------------------
function send(msg) {
  socket.send(JSON.stringify(msg))
}

///////////////////////////////////////////////////////////////////////
// all of the RTCPeerConnection events

//---------------------------------------------------------------------
// when a candidate is generated, send it to the signalling server
//---------------------------------------------------------------------
peerConnection.onicecandidate = function({candidate}) {
  send({candidate});
}

//---------------------------------------------------------------------
// when you need to negotiate with your peer, generate an offer and
// send it to the signalling server
//---------------------------------------------------------------------
peerConnection.onnegotiationneeded = async function() {
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  send({description: peerConnection.localDescription});
};

//---------------------------------------------------------------------
// ontrack is called when the peerConnection
//---------------------------------------------------------------------
peerConnection.ontrack = function(event) {
  // do something here to show the video
  remoteVideo.srcObject = event.streams[0];

  // log tracks
  console.log("----TRACK----")
  console.log(event)
  console.log("-------------")
};
