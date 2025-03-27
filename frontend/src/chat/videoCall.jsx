/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useRef, useEffect, useState } from "react";
import { socket } from "./socket.jsx";
import "./videocall.css";
import { FaPhone, FaSync, FaMicrophoneSlash, FaMicrophone, FaVideo, FaVideoSlash, FaTimes } from "react-icons/fa";

const VideoCall = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const [callStarted, setCallStarted] = useState(false);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isSelfViewDragging, setIsSelfViewDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });

    useEffect(() => {
        peerConnection.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        startLocalStream();

        peerConnection.current.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", event.candidate);
            }
        };

        socket.on("offer", async (offer) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit("answer", answer);
        });

        socket.on("answer", async (answer) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", (candidate) => {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
        };
    }, []);

    const startLocalStream = async () => {
        try {
            const constraints = {
                video: { facingMode: isFrontCamera ? "user" : "environment" },
                audio: true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    };

    const startCall = async () => {
        if (callStarted) return;
        setCallStarted(true);

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit("offer", offer);
    };

    const flipCamera = () => {
        setIsFrontCamera(prev => !prev);
        startLocalStream();
    };

    const toggleMute = () => {
        const stream = localVideoRef.current.srcObject;
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = isMuted);
        }
        setIsMuted(prev => !prev);
    };

    const handleDragStart = (e) => {
        setIsSelfViewDragging(true);
    };

    const handleDragEnd = (e) => {
        setIsSelfViewDragging(false);
    };

    const handleDragging = (e) => {
        if (!isSelfViewDragging) return;
        setPosition({ x: e.clientX - 75, y: e.clientY - 50 });
    };

    return (
        <div className="video-container">
            {/* Receiver Video (Full Screen) */}
            <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />

            {/* Self Video - Draggable */}
            <video
                ref={localVideoRef}
                className="local-video"
                autoPlay
                playsInline
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragging}
                onMouseUp={handleDragEnd}
            />

            {/* Controls */}
            <div className="controls">
                <button onClick={startCall} disabled={callStarted} className="icon-btn"><FaPhone /></button>
                <button onClick={flipCamera} className="icon-btn"><FaSync /></button>
                <button onClick={toggleMute} className="icon-btn">{isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}</button>
                <a href="/chat" className="icon-btn"><FaTimes /></a>
            </div>
        </div>
    );
};

export default VideoCall;
