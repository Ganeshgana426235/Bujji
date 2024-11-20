import React, { useState, useRef, useEffect } from "react";
import axios from "axios"; // Import Axios
import "./App.css";

const App = () => {
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      question: "Start Chatting...", 
      response: "I might take a little time to warm up, like a car engine on a cold morning, but once I'm rolling, it's like a turbo boost!-  ⚡︎____ᯓᡣō͡≡o˞̶_____",
      isEditing: false,
    }
  ]); // Default response message
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if speech is happening
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const chatContainerRef = useRef(null);
  const speechRef = useRef(null); // Reference to the speech instance
  const textareaRef = useRef(null); // Reference to the textarea element

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  // Function to handle voice input
  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const voiceInput = event.results[0][0].transcript;
      setQuestion(voiceInput);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  // Function to handle text-to-speech for the response
  const handleSpeech = (responseText) => {
    if (isSpeaking) {
      return; // Prevent starting new speech while speaking
    }

    const speech = new SpeechSynthesisUtterance(responseText);
    speech.lang = "en-US";
    speech.volume = 1; // Volume level (0 to 1)

    // Set reference to the speech instance
    speechRef.current = speech;
    
    window.speechSynthesis.speak(speech);
    setIsSpeaking(true); // Mark speech as active

    speech.onend = () => {
      setIsSpeaking(false); // Reset speaking state after speech ends
    };
  };

  // Function to stop speaking
  const handleStopSpeech = () => {
    if (speechRef.current) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      setIsSpeaking(false); // Reset speaking state
    }
  };

  // Modify handleSubmit to send the question to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (question.trim() === "") return;

    setIsLoading(true); // Set loading to true while processing

    try {
      // Send the question to the backend (Flask)
      const response = await axios.post("http://localhost:5000/get_response", {
        question: question,
      });
      
      // Add the question and response to the chat log
      setChatLog([
        ...chatLog,
        {
          question: question,
          response: response.data.response,
        },
      ]);
      setQuestion(""); // Clear the input field

      // Reset the textarea height to 1 row
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // Reset height
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Adjust height to fit content
      }
    } catch (error) {
      console.error("Error sending question to the backend:", error);
    } finally {
      setIsLoading(false); // Set loading to false when the request finishes
    }
  };

  // Handle editing a chat message
  const handleEdit = (index) => {
    const updatedChatLog = [...chatLog];
    updatedChatLog[index].isEditing = true; // Mark this message as being edited
    setChatLog(updatedChatLog);
  };

  // Handle updating the chat message (question and response)
  const handleUpdate = async (index, updatedQuestion) => {
    const updatedChatLog = [...chatLog];
    updatedChatLog[index].question = updatedQuestion; // Update the question

    try {
      // Send the updated question to the backend to get the new response
      const response = await axios.post("http://localhost:5000/get_response", {
        question: updatedQuestion,
      });

      // Update the response in the chat log
      updatedChatLog[index].response = response.data.response;
      updatedChatLog[index].isEditing = false; // Mark as done editing

      setChatLog(updatedChatLog);
    } catch (error) {
      console.error("Error updating the message:", error);
    }
  };

  // Handle auto-resizing of the textarea
  const handleTextareaResize = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto"; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height to fit content
  };

  return (
    <div className="chat-container">
      {/* Navbar */}
      <div className="navbar">
        <h1> ō͡≡о Ƀ𝚄𝙹𝙹Ï ✇ <br></br>{isLoading && <div className="loading">Thinking... One second</div>}</h1>
        
      </div>

      {/* Chat Area */}
      <div className="chat-body">
        {/* Chat Log */}
        <div className="chat-log" ref={chatContainerRef}>
          {chatLog.map((chat, index) => (
            <div className="chat-message" key={index}>
              {/* User Input with Edit Button */}
              <div className="question-input">
                {chat.isEditing ? (
                  <div className="edit-container">
                    <textarea
                      className="edit-input"
                      rows={1}  // Initial row count
                      value={chat.question}
                      onChange={(e) => {
                        const updatedChatLog = [...chatLog];
                        updatedChatLog[index].question = e.target.value;
                        setChatLog(updatedChatLog);
                      }}
                      onInput={handleTextareaResize} // Auto-resize the textarea
                      autoFocus
                    />
                    <button
                      className="update-button"
                      onClick={() => handleUpdate(index, chat.question)}
                    >
                      Update
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="question">{chat.question}</p>
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(index)}
                    >
                      🖊️
                    </button>
                  </>
                )}
              </div>

              {/* Response with Speaker Button */}
              <div className="response-container">
                <pre className="response">{chat.response}</pre> {/* Preformatted text */}
                <button
                  className="speaker-button"
                  onClick={() => handleSpeech(chat.response)}
                >
                  🔊
                </button>
                {isSpeaking && (
                  <button
                    className="stop-button"
                    onClick={handleStopSpeech}
                  >
                    ⏹
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Input Form */}
        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            className="text-input"
            ref={textareaRef}  // Reference to the textarea element
            rows={1}  // Start with 1 row
            value={question}
            placeholder="Type your message..."
            onChange={(e) => setQuestion(e.target.value)}
            onInput={handleTextareaResize} // Auto-resize the textarea
          />
          <button
            type="button"
            className="mic-button"
            onClick={handleVoiceInput}
          >
            🎙️
          </button>
          <button type="submit"> ➤ </button>
        </form>

        {/* Loading Indicator */}
        <div className="container">
          <h5 className="copyright">&copy; Y Ganesh<a href="https://my-portfolio-ganesh.s3.eu-north-1.amazonaws.com/index.html">🌐</a>  </h5>
        </div>
      </div>
    </div>
  );
};

export default App;
