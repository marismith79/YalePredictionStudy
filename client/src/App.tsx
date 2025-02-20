import "./App.css";
import "./index.css";
import { Route, Redirect } from "wouter";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Questionnaire from "./pages/Questionnaire";
import About from "./pages/About";
import Completion from "./pages/Completion";
import { Header } from "./components/Header";

function App() {
  const isAuthenticated = () => Boolean(localStorage.getItem("token"));

  return (
    <div>
      <Header />
      <Route path="/" component={Login} />
      <Route path="/chat">
        {() => (isAuthenticated() ? <Chat /> : <Redirect to="/" />)}
      </Route>
      <Route path="/questionnaire">
        {() => (isAuthenticated() ? <Questionnaire /> : <Redirect to="/" />)}
      </Route>
      <Route path="/about" component={About} />
      <Route path="/completion" component={Completion} />
    </div>
  );
}

export default App;
