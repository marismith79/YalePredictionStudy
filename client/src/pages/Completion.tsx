import { useLocation } from "wouter";

export default function Completion() {
  const externalUrl = "https://app.prolific.com/submissions/complete?cc=C1IX1AED";

  return (
    <div style={{ padding: "20vh", textAlign: "center" }}>
      <h2>Thank you for completing the study tasks for this week!</h2>
      <br></br>
      <p>
        To generate your completion code, please click{" "}
        <a href={externalUrl} target="_blank" rel="noopener noreferrer">
          this extrenal link
        </a>.
      </p>
    </div>
  );
}
