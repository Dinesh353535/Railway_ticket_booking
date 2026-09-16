import React from "react";
import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import App from "./App";
import "./index.css";
import "./App.css";

import { clearOldLocalLogin } from "./utils/auth";

/*
  Login details are kept in sessionStorage so that
  closing the window logs the user out. Any old login
  values stored in localStorage are cleared here.
*/
clearOldLocalLogin();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
