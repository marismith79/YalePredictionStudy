import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { motion } from "framer-motion";

interface ControlsProps {
  onEndCall: () => void;
}

export default function Controls({ onEndCall }: ControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full p-4 flex items-center justify-center">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"
      >
        <Button
          className="flex items-center gap-1"
          onClick={onEndCall}
          variant="destructive"
        >
          <Phone className="size-4 opacity-50" strokeWidth={2} stroke="currentColor" />
          <span>End Interview</span>
        </Button>
      </motion.div>
    </div>
  );
}
