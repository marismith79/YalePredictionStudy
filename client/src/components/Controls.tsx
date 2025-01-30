import { useVoice } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { Mic, MicOff, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useHume } from '../hooks/useHume';

interface ControlsProps {
  onEndCall: () => void; 
}

export default function Controls({ onEndCall }: ControlsProps) {
  // const { disconnect, status, isMuted, unmute, mute, micFft } = useVoice();


  const { 
    connected, 
    disconnect, 
  } = useHume();

  console.log("Controls connected:", connected);

  return (
    <div className={cn("fixed bottom-0 left-0 w-full p-4 flex items-center justify-center", "bg-gradient-to-t from-card via-card/90 to-card/0")}>
      {connected === true && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          className={"p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"}
        >
          {/* <Toggle pressed={!isMuted} onPressedChange={() => (isMuted ? unmute() : mute())}>
            {isMuted ? <MicOff className={"size-4"} /> : <Mic className={"size-4"} />}
          </Toggle> */}

          {/* <div className={"relative grid h-8 w-48 shrink grow-0"}>
            <MicFFT fft={micFft} className={"fill-current"} />
          </div> */}

          <Button
            className={"flex items-center gap-1"}
            onClick={() => {
              disconnect();  // Disconnect the call
              onEndCall();   // Call the provided onEndCall handler
            }}
            variant={"destructive"}
          >
            <span>
              <Phone className={"size-4 opacity-50"} strokeWidth={2} stroke={"currentColor"} />
            </span>
            <span>End Call</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
