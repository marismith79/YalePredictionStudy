import { useVoice } from "@humeai/voice-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";

export default function StartCall() {
  const { status, connect } = useVoice();

  return (
    <>
      {status.value !== "connected" && (
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
            <Button
              onClick={() => {
                connect()
                  .then(() => console.log("Connected"))
                  .catch((error) => console.error("Connection error:", error))
                  .finally(() => console.log("Connection attempt finished"));
              }}
            >
              <span>
                <Phone strokeWidth={2} stroke={"currentColor"} />
              </span>
              <span>Start Submission</span>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
