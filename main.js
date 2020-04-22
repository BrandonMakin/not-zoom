///////////////////////////////////////////////////////////////
// Get user video and audio

function handleSuccess(stream) {
  const video = document.querySelector('video');
  video.srcObject = stream;
}

const constraints = {
  audio: true,
  video: { width: 1280, height: 720 }
}

async function init(e) {
  try {
    console.log("Success!");
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;

  }
  catch (e) {
    console.log("Error!");
    console.log(e)
  }
}

document.querySelector('#start').addEventListener('click', e => init(e));

///////////////////////////////////////////////////////////////
// Signalling Server
let peerConnection = new RTCPeerConnection();



let findEachOtherServer = {
  ///////////////////////////////////////////////////////////////
  /// gets called when the server sends us a new message
  ///
  async onmessage(data) {
    // called every time the client gets a message from the server
    if (data.description) {
      // if we get an offer
      if (data.description.type == 'offer') {
        // set remote description based on what we received
        await peerConnection.setRemoteDescription(desc);
        // generate and set a local description by creating an answer.
        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        // respond to the offer by sending our answer that we just generated.
        this.send({desc: pc.localDescription});
      }
      // if we get an answer
      else if (data.description.type == 'answer') {
        // save the remote description that we just got.
        // at this point, each peer has both a remote description and a local description saved.
        await peerConnection.setRemoteDescription(desc);
      }
    }
    else if (data.candidate) {
      // tell the peerConnection about the new ICE candidate
      await peerConnection.addIceCandidate(data.candidate);
    }
  },
  ///////////////////////////////////////////////////////////////
  /// we send the server a new message
  ///
  send(data) {
    // the client sends a message to the server
    // send over websockets or something
  },
  ///////////////////////////////////////////////////////////////
  /// handle all the logic of checking the server for messages
  ///
  getMessagesLogic() {
    // does something to get the messages
    // when you get a message, this function calls onmessage
    this.onmessage();
  }
}
