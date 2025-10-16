import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
    const [message, setMessage] = useState("");

    // GET /api/message
    useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/message")
        .then(res => setMessage(res.data.message))
        .catch(err => console.error(err));
    }, []);

    // POST /api/echo
    const sendEcho = () => {
    axios.post("http://127.0.0.1:5000/api/echo", { text: "Hello :D" })
        .then(res => console.log("Flask response:", res.data))
        .catch(err => console.error(err));
    };

    return (
        <div>
            <h1>Debate Match RAG</h1>
            <p>Backend says: {message}</p>
            <button onClick={sendEcho}>Send Data to Flask</button>
        </div>
    );
}
