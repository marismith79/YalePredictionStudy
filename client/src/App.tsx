import "./App.css";
import './index.css';
import { Route } from "wouter";
import Chat from "./pages/Chat";

function App() {

  return (
    <div>
        <Route path="/" component={Chat} />
    </div>
  );
}

export default App;