//services
import Router from "/frontend/services/Router.js";
import API from "/frontend/services/API.js";
import VDOMService from "/frontend/services/vDOMService.js";
import "/frontend/components/UiPopup/UiPopup.js";
import PopupService from "/frontend/services/PopupService.js";

//link components
import { MainPage } from "/frontend/components/MainPage/MainPage.js";
import { SolverHomePage } from "/frontend/components/SolverHomePage/SolverHomePage.js";
import { SolverVariablesPage } from "/frontend/components/SolverVariablesPage/SolverVariablesPage.js";

window.app = {};
const app = window.app;
app.router = Router;

window.addEventListener("DOMContentLoaded", () => {
  console.log("App: DOMContentLoaded event listener callback");
  app.router.init();
});
