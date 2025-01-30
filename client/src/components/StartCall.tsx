import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Mic } from "lucide-react";
import { useHume } from '../hooks/useHume';

export default function StartCall() {
  const { connected, connect } = useHume();

  console.log("StartCall connected:", connected);
  
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
            <div className="centered-button-container"> {/* Ensures centering */}
              <Button
                onClick={() => {
                  console.log(connected);
                  connect()
                    .then(() => console.log(connected))
                    .catch((error: any) => console.error("Connection error:", error))
                    .finally(() => console.log("Connection attempt finished", connected));
                }}
              >
                <span>
                  <Mic strokeWidth={2} stroke={"currentColor"} />
                </span>
                <span>Start Interview</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
