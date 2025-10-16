import { useEffect, useState } from "react";

export default function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
    fetch("/api/message")
        .then((res) => res.json())
        .then((data) => setMessage(data.message)) // save the response
        .catch((err) => console.error("ERROR: Failed to fetch from Flask:", err));
    }, []);

    const sendEcho = async () => {
        try {
            const res = await fetch("/api/echo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: "Hello :D" }),
            });

            const text = await res.text();
            console.log("Raw response:", text);

            if (!text) {
                console.error("Empty response from server");
                return;
            }

            const data = JSON.parse(text);
            console.log("Parsed JSON:", data);

        }
        
        catch (err) {
            console.error("Fetch error:", err);
        }
    };


    return (
        <div>
            <h1>Debate AI</h1>
            <p>Backend says: {message}</p>
            <button onClick={sendEcho}>Send Data to Flask</button>
        </div>
    );
}
