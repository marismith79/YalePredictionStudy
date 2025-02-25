import { useEffect, useState } from "react";
import { humeService } from "../humeService"; 
import Controls from "../components/Controls";
import StartCall from "../components/StartCall";
import { Info, ArrowDown } from "lucide-react";
import { useLocation } from "wouter";

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null); 
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [timerActive, setTimerActive] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [, setLocation] = useLocation();

  const handleEndCall = () => {
    console.log("Call ended");
    humeService.disconnect(); 
    setTimerActive(false); 
    setInterviewEnded(true); 
    localStorage.setItem("elapsedTime", elapsedTime.toString());
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
    setStartTime(Date.now());  
    setTimerActive(true);       
  };

  const handleStartQuestionnaire = () => {
    setLocation("/questionnaire");
  };

  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && startTime !== null) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000)); 
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, startTime]);

  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div>
      <div className="info-container">
        <Info className="info-icon" />
        <span className="tooltip-text">
          Please begin this interview in a quiet location. The session will terminate automatically after 5 minutes. Please complete each recording in one sitting and only press "End" once you are done responding to all questions. If you ever need clarity on a question, you can ask for it to be rephrased. If you are ever unnerved by a question, you can always request a new one. Please read the Troubleshooting box if you run into issues.
        </span>
      </div>
      <Controls onEndCall={handleEndCall} />
      <StartCall onStartCall={handleStartCall} />
      <div className="arrow-container" style={{ textAlign: "center" }}>
            <ArrowDown size={40} />
      </div>
      {interviewEnded && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "500px" }}>
          <button onClick={handleStartQuestionnaire}>
            Start Questionnaire
          </button>
        </div>
      )}
      {timerActive && startTime !== null && (
        <div className="elapsed-time">
          <p>Time: {formatElapsedTime(elapsedTime)}</p>
        </div>
      )}
      <div className="section-card">
        <h2 className="chat-container">Troubleshooting</h2>
        <p className="page-content">
        1. If you cannot hear sound after starting the interview, your browser is likely incompatible. This interview is NOT compatible with Safari or mobile phones. Please use Chrome or Firefox instead.
        <br></br>
        <br></br>
        2. If Stella stops responding with interview questions, politely ask her for the next question. If she still does not respond, reload the page, return to login, and restart the process. If this still does not work, please send a message to the researcher through Prolific.
        <br></br>
        <br></br>
        3. If you ever experience a repeated question, politely ask for a different question.
        <br></br>
        <br></br>
        4. If another issue occurs, please message the researcher through Prolific.
        </p>
      </div>
    </div>
  );
}
