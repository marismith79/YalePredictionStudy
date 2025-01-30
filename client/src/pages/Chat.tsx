import { useEffect, useState } from "react";
import { humeService } from "../humeService"; 
import Controls from "../components/Controls";
import StartCall from "../components/StartCall";
import { Info } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);

  const handleEndCall = () => {
    console.log("Call ended");
    humeService.disconnect();  // Disconnect when ending the call
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

  return (
    <div className="full-height-container">
      <div className="info-container">
        <Info className="info-icon" />
        <span className="tooltip-text">Please complete the interview in one go. This recording will stop after 7 minutes. After you've completed your recordings, please enter your Prolific ID in the text block below.</span>
      </div>
      <Controls onEndCall={handleEndCall} />
      <StartCall />
    </div>
  );
}