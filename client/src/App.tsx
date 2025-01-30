import "./App.css";
import './index.css'
import axios from "axios";
import { useState } from "react";
import { Route } from "wouter";
import Chat from "./pages/Chat";

function App() {
  const [data, setData] = useState();
  const urlWithProxy = "/api/v1";

  function getDataFromServer() {
    axios
      .get(urlWithProxy)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
      });
  }

  return (
    <div>
        <Route path="/" component={Chat} />
    </div>
  );
}

export default App;