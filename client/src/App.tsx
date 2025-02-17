import "./App.css";
import './index.css';
import { Route, Redirect } from "wouter";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Questionnaire from "./pages/Questionnaire";

function App() {

  const isAuthenticated = () => Boolean(localStorage.getItem("token"));

  return (
    <div>
      <Route path="/" component={Login} />
      <Route path="/chat" component={Chat} >
      {() => (isAuthenticated() ? <Chat /> : <Redirect to="/" />)}
      </Route>
      <Route path="/questionnaire">
        {() => (isAuthenticated() ? <Questionnaire /> : <Redirect to="/" />)}
      </Route>
    </div>
  );
}

export default App;