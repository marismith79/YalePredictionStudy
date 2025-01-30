import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { useHume } from '../hooks/useHume';

interface StartProp {
  onStartCall: () => void; 
}

export default function StartCall({ onStartCall }: StartProp) {
  const { 
    connected, 
    connect,    
    disconnect, 
  } = useHume();

  return (
    <>
      {connected !== true && (
        <motion.div
          initial="initial"
          animate="enter"
          exit="exit"
          variants={{
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 },
          }}
        >
          <motion.div
            variants={{
              initial: { scale: 0.5 },
              enter: { scale: 1 },
              exit: { scale: 0.5 },
            }}
          >
            <div className="centered-button-container">
              <Button
                onClick={() => {
                  connect()
                    .then(() => {
                      onStartCall(); 
                    })
                    .catch((error: any) => {
                      console.error("Connection error:", error); 
                    });
                }}
              >
                <span>
                  <Phone strokeWidth={2} stroke={"currentColor"} />
                </span>
                <span>Start Call</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
