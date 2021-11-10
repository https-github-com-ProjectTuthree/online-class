//import { encrypt, decrypt } from "../crypto";

const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const screenBtn = document.getElementById("screen");
const myScreenVideo = document.getElementById("myScreenVideo");

call.hidden = true;

let myStream;
let muted = true;
let cameraOff = true;
let roomInfo;
let check;
let myPeerConnection;
let myDataChannel;
let myScreen;
async function getScreen(){
    try{
        myScreen = await navigator.mediaDevices.getDisplayMedia({
           video: true,
           audio: true
   });
   console.log(myScreen);
    
    
    }catch(e){
       console.log(e);
  }
    
} 

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device => device.kind === "videoinput"));
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option")
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
        console.log(cameras);
    } catch (e){
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstraints = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
        await getScreen();
        myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
        myStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
        myScreen.getVideoTracks().forEach(track => myStream.addTrack(track));
          
        muted=false;
        cameraOff=false;
        
    }catch (e){
        console.log(e);
    }

}


/* async function handleSuccess() {
    startButton.disabled = true;
    myScreen = await navigator.mediaDevices.getDisplayMedia({
                  audio: true,
                   video: true
           });
    myScreenVideo.srcObject = myScreen;
  
    // demonstrates how to detect that the user has stopped
    // sharing the screen via the browser UI.
    myScreen.getVideoTracks()[0].addEventListener('ended', () => {
      startButton.disabled = false;
    });
  }


const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({video: true})
        .then(handleSuccess);
  });
if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  startButton.disabled = false;
}  */
//try{
//    myScreen = await navigator.mediaDevices.getDisplayMedia({
//        audio: true,
//        video: true
//    }).then(function(stream){
//    //success
// }).catch(function(e){
    //error;
 //});

getMedia();
 function handleScreenClick(){
    getScreen();
} 

function handleMuteClick(){
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = "음소거"
        muted = true;
    } else {
        muteBtn.innerText = "음소거 해제";
        muted = false;
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));

    if(!cameraOff){
        cameraBtn.innerText= "카메라 끄기";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "카메라 켜기";
        cameraOff = false;
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) =>sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
screenBtn.addEventListener("click", handleScreenClick);

//welcome form (join a room)

//const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    //await getScreen();
    
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const id = welcomeForm.querySelectorAll("input")[0];
    const pw = welcomeForm.querySelectorAll("input")[1];
    roomInfo = id.value+pw.value;
    await initCall();
    socket.emit("join_room", roomInfo);
    //check = pw.value;
    //id.value = "";
    //pw.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//Socket Code

socket.on("welcome", async() => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener=("message", console.log);
    console.log("someone joind");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomInfo);
});

socket.on("offer", async(offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", console.log);
    });
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomInfo);
    console.log("sent to answer");
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
    
});

socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

//RTC Code

function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19032",
                    "stun:stun2.l.google.com:19032",
                    "stun:stun3.l.google.com:19032",
                    "stun:stun4.l.google.com:19032",
                ],
            },
        ],
    });
    
    console.log("getTrack");
    console.log(myStream.getTracks());
    console.log("myStream");
    console.log(myStream);
    //console.log("myScreen");
    //console.log(myScreen);
    //console.log("myScreentrack");
    //console.log(myScreen.getTracks());
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    //myScreen.getVideoTracks().forEach(track => myPeerConnection.addTrack(track, myScreen));

}

function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomInfo);
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    const peerScreen = document.getElementById("peerScreen");
    console.log("data");
    console.log(data.stream.getTracks());
    console.log("data");
    peerFace.srcObject = data.stream;
    //peerScreen.srcObject=data.stream;
    let newStream = new MediaStream();
    newStream.addTrack(data.stream.getTracks()[2]);
    console.log(newStream.getTracks());
    peerScreen.srcObject= newStream;
}