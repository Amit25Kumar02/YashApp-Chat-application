import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/login";
import Chat from "./chat/chat";
import VideoCall from "./chat/videoCall";
import AudioCall from "./chat/audioCall";
import { AuthProvider } from "./chat/authContext";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/video/:receiverId" element={<VideoCall />} />
                    <Route path="/audio/:receiverId" element={<AudioCall />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
