import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { IntlProvider } from "react-intl";
import enMessages from "./translations/en";

const root = ReactDOM.createRoot(document.getElementById("root"));


root.render(
  <React.StrictMode>
    <IntlProvider locale="en" messages={enMessages}>
      <App />
    </IntlProvider>
  </React.StrictMode>
);
