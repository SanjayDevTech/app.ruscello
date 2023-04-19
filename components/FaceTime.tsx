import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { socket } from "@/context/socketUrl";
import { Peer } from "peerjs";

import Draggable from "react-draggable";

import Mic from "@/public/svg/mic.svg";
import MicOff from "@/public/svg/mic off.svg";
import VideoCam from "@/public/svg/videocam.svg";
import VideoCamOff from "@/public/svg/videocam off.svg";
import CallEnd from "@/public/svg/call end.svg";

export default function FaceTime() {
  const router = useRouter();
  const { id: roomName } = router.query;
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const renderVideo = useRef<any>(null);
  const userVideoRef = useRef<any>();
  const [videoSources, setVideoSources] = useState([]);
  //let myVideoStream = { id: socket.id, stream: userVideoRef.current.srcObject };

  const peer = new Peer();

  // get user media
  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        userVideoRef.current.srcObject = stream;
      } catch (err) {
        console.log("Failed to get local stream" + err);
      }
    };
    getUserMedia();

    peer.on("open", (id) => {
      //console.log("My peer ID is: " + id);
      //myVideoStream.id = id;
      socket.emit("joinUser", roomName, id);
    });

    peer.on("error", (error) => {
      console.error(error);
    });

    // Handle incoming voice/video connection
    peer.on("call", (call) => {
      const getRemoteMedia = async () => {
        try {
          const remoteStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          // Answer the call with an A/V stream.
          call.answer(remoteStream);
          call.on("stream", (remoteStream) => {
            // setVideoSources((videoSources) => {
            //   if (!videoSources.some((e) => e.id === call.peer)) {
            //     return [
            //       ...videoSources,
            //       { id: call.peer, stream: remoteStream },
            //     ];
            //   } else {
            //     return videoSources;
            //   }
            // });
            // Show stream in some video/canvas element.
            renderVideo.current.srcObject = remoteStream;
          });
        } catch (err) {
          console.log("Failed to get local stream" + err);
        }
      };
      getRemoteMedia();
    });

    socket.on("user-connected", (userId) => {
      // Call the new user
      const call = peer.call(userId, userVideoRef.current.srcObject);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          let call = peer.call(userId, stream);
          call.on("stream", (remoteStream) => {
            // Show stream in some video/canvas element.
            renderVideo.current.srcObject = remoteStream;
            setVideoSources([
              ...videoSources,
              { id: userId, stream: remoteStream },
            ]);
          });
        })
        .catch((err) => {
          console.log("Failed to get local stream", err);
        });
      console.log("user connected");

      call.on("stream", (userVideoStream) => {
        console.log("received new user");
        setVideoSources([
          ...videoSources,
          { id: userId, stream: userVideoStream },
        ]);
      });

      // If they leave, remove their video (doesn't work)
      call.on("close", () => {
        setVideoSources((videoSources) =>
          videoSources.filter((a) => a.id !== userId)
        );

        //  If the call gives an error
        call.on("error", (err) => {
          console.log(err);
        });
      });
    });

    // If a user disconnect
    socket.on("user-disconnected", (userId) => {
      setVideoSources((videoSources) =>
        videoSources.filter((a) => a.id !== userId)
      );

      renderVideo.current.srcObject = null;
    });

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");
      peer.off("open");
      peer.off("call");
    };
  }, []);

  function toggleMic() {
    setMicActive((prev) => !prev);

    if (micActive) {
      userVideoRef.current.srcObject.getAudioTracks()[0].enabled = false;
    }
    if (!micActive) {
      userVideoRef.current.srcObject.getAudioTracks()[0].enabled = true;
    }
  }

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);

    if (cameraActive) {
      userVideoRef.current.srcObject.getVideoTracks()[0].enabled = false;
    }
    if (!cameraActive) {
      userVideoRef.current.srcObject.getVideoTracks()[0].enabled = true;
    }
  };

  function leave() {
    if (userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }

    socket.emit("leaveRoom", roomName);
    peer.disconnect();
    window.location.reload();
    home();
  }
  function home() {
    router.push("/");
  }

  return (
    <div>
      <div className="h-screen p-2 z-50">
        <Draggable bounds="parent">
          <div className="cursor-grab flex flex-col justify-end items-end fixed bottom-2 right-4 space-y-10">
            <div className="flex flex-row ">
              <video
                ref={userVideoRef}
                className="w-40 bg-blue-100 rounded border-blue-400 mr-2"
                autoPlay
                muted
              />

              <video
                ref={renderVideo}
                className="w-40 bg-green-100 rounded border-green-400"
                autoPlay
              />
            </div>
          </div>
        </Draggable>
      </div>
      <div className="flex flex-row justify-center items-center fixed bottom-0 w-full space-x-10">
        <button onClick={toggleMic} type="button">
          {micActive ? (
            <Image src={Mic} alt="Mic-on" />
          ) : (
            <Image src={MicOff} alt="Mic-off" />
          )}
        </button>
        <button onClick={leave} type="button">
          <Image src={CallEnd} alt="Call-end" />
        </button>
        <button onClick={toggleCamera} type="button">
          {cameraActive ? (
            <Image src={VideoCam} alt="Cam-on" />
          ) : (
            <Image src={VideoCamOff} alt="Cam-off" />
          )}
        </button>
      </div>
    </div>
  );
}
