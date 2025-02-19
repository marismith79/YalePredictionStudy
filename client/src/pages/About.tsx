import "../App.css"
import TeamMember from "../components/TeamMember";
import image1 from "../shomari.jpeg"
import image2 from "../lawrence.jpeg"
import image3 from "../anylan_bkg.jpeg"

const link1 = "shomari.smith@yale.edu"
const link2 = "lawrence.staib@yale.edu"

export default function About() {
  return (
    <div className="section-container">
      <div className="background-container">
        <img src={image3} alt="Background" />
        <div className="overlay-container">
          <h1 className="company-slogan"> Help us Advance the Future of Crisis Care!</h1>
          <h3 className="company-sub-slogan">Join the study using NLP to predict psychosis relapse</h3>
        </div>
      </div>
      <section className="section-card">
        <h1 className="page-header">About the Study</h1>
        <div>
        <p className="page-content">
        Welcome to the Staib Lab's longitudinal psychosis relapse prediction study! The study is aimed at analyzing data to develop technologies possible of predicting relapse in psychosis weeks in advance. It is a month long longitudinal study to collect and analyzing speech data from participants who experience psychosis.
        </p>
        </div>
        <div>
        <p className="page-content">
        Once a week you will be asked to submit a short 5-minute audio interview and quick questionnaire. None of the collected data will ever be disclosed outside of this survey unless requested by federal law. All responses are collected with your consent and in compliance with HIPPA regulations. If you have any questions, feel free to contact the P.I. Proxy via the emails linked to their headshots.
        </p>
        </div>
      </section>

      <section className="section-card">
        <h2 className="page-header">Research Team</h2>
        <div>
            <TeamMember
              name="Shomari Smith"
              department="Biomedical Engineering"
              title="P.I. Proxy and Researcher"
              image={image1}
              link={link1}
            />
            <br></br>
            <TeamMember
              name="Lawrence Staib, PhD"
              department="Radiology and Biomedical Imaging, of Biomedical Engineering"
              title="Professor and P.I."
              image={image2}
              link={link2}
            />
        </div>
      </section>
    </div>
  );
}
