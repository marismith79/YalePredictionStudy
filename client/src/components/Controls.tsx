import { Button } from "./ui/button";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { useHume } from '../hooks/useHume';

interface ControlsProps {
  onEndCall: () => void; 
}

export default function Controls({ onEndCall }: ControlsProps) {
  const { 
    connected, 
    disconnect, 
  } = useHume();

  // console.log("Controls connected:", connected);

  return (
    <div>
      {connected === true && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          className={"p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"}
        >
          <Button
            onClick={() => {
              disconnect(); 
              onEndCall();  
            }}
            variant={"destructive"}
          >
            <span>
              <Mic className={"size-4 opacity-50"} strokeWidth={2} stroke={"currentColor"} />
            </span>
            <span>End Interview</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
