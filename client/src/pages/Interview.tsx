import React, { useState, useEffect, useRef } from "react";
import { VoiceProvider } from "@humeai/voice-react";
import { getHumeAccessToken } from "../humeAuth";
import Controls from "../components/Controls";
import StartCall from "../components/StartCall";

export default function Chat() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const timerRef = useRef<any>(null);

  // Fetch access token on component mount
  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const token = await getHumeAccessToken();
        setAccessToken(token);  // Store the access token in state
      } catch (error) {
        console.error("Error fetching access token:", error);
      }
    };
    fetchAccessToken();
  }, []);

  useEffect(() => {
    if (interviewStarted) {
      // Start the timer when the interview begins
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (!interviewStarted && elapsedTime !== 0) {
      // Stop the timer when the interview ends
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current); // Cleanup on unmount
  }, [interviewStarted]);

  const handleEndInterview = () => {
    clearInterval(timerRef.current);
    setInterviewStarted(false); // Set to false to show Start Interview button again
    setShowNotification(true); // Show the notification

    // Hide the notification after 15 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 15000);
  };

  if (!accessToken) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative grow flex flex-col mx-auto w-full overflow-hidden h-[0px]">
      {!interviewStarted ? (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={() => setInterviewStarted(true)}
            className="text-xl py-2 px-4 bg-blue-500 text-white rounded-full"
          >
            Start Interview
          </button>
        </div>
      ) : (
        <VoiceProvider
          auth={{ type: "accessToken", value: accessToken }}  // Use the access token here
        >
          <div className="flex flex-col items-center justify-center">
            <p>Time elapsed: {Math.floor(elapsedTime / 60)}:{elapsedTime % 60}</p>
            <Controls onEndCall={handleEndInterview} />
          </div>
        </VoiceProvider>
      )}

      {/* Notification Message */}
      {showNotification && (
        <div className="notification visible">
          <span>Thanks for your response, please return to Prolific to verify your submission.</span>
        </div>
      )}
    </div>
  );
}
