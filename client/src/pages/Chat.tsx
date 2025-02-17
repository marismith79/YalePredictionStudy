import { useEffect, useState } from "react";
import { humeService } from "../humeService"; 
import Controls from "../components/Controls";
import StartCall from "../components/StartCall";
import { Info, ArrowDown } from "lucide-react";
import { useLocation } from "wouter";

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null); // For tracking the start time
  const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time in seconds
  const [timerActive, setTimerActive] = useState(false); // To track if the timer is running
  const [interviewEnded, setInterviewEnded] = useState(false); // To track if the interview has ended
  const [, setLocation] = useLocation();

  const handleEndCall = () => {
    console.log("Call ended");
    humeService.disconnect();  // Disconnect when ending the call
    setTimerActive(false); // Stop the timer
    setInterviewEnded(true); // Mark interview as ended
  };

  // Subscribe to messages from HumeService
  const messageListener = (message: any) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  useEffect(() => {
    // Add the message listener when component mounts
    humeService.addMessageListener(messageListener);
    // Cleanup listener when component unmounts
    return () => {
      humeService.removeMessageListener(messageListener);
    };
  }, []);

  const handleStartCall = () => {
    setStartTime(Date.now());  // Record the start time
    setTimerActive(true);       // Start the timer
  };

  // New handler for the questionnaire button
  const handleStartQuestionnaire = () => {
    setLocation("/questionnaire");
  };

  // Update elapsed time every second when the timer is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && startTime !== null) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000)); // Update the elapsed time
      }, 1000);
    }
    // Cleanup the interval when the timer is not active
    return () => clearInterval(timer);
  }, [timerActive, startTime]);

  // Format elapsed time into mm:ss format
  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="full-height-container">
      <div className="info-container">
        <Info className="info-icon" />
        <span className="tooltip-text">
          Hello there! Just to let you know, this recording will terminate automatically after 7 minutes. Please complete each recording in one sitting and only press "End" once you are finished responding. Once you've finished recording, return to Prolific to verify completion. Thank you again for your time!
        </span>
      </div>
      <Controls onEndCall={handleEndCall} />
      <StartCall onStartCall={handleStartCall} />
      <div className="arrow-container" style={{ textAlign: "center" }}>
            <ArrowDown size={48} />
      </div>
      {interviewEnded && (
        <button onClick={handleStartQuestionnaire} style={{ marginBottom: "500px" }}>
          Start Questionnaire
        </button>
      )}
      {/* Elapsed time display */}
      {timerActive && startTime !== null && (
        <div className="elapsed-time">
          <p>Time: {formatElapsedTime(elapsedTime)}</p>
        </div>
      )}
    </div>
  );
}
