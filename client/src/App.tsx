import "./App.css";
import './index.css';
import { Route } from "wouter";
import Chat from "./pages/Chat";
import Login from "./pages/Login";

function App() {

  return (
    <div>
      <Route path="/" component={Login} />
      <Route path="/chat" component={Chat} />
    </div>
  );
}

export default App;