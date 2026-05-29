//services
import Router from "/frontend/services/Router.js";
import API from "/frontend/services/API.js";
import VDOMService from "/frontend/services/vDOMService.js";
import "/frontend/components/UiPopup/UiPopup.js";
import PopupService from "/frontend/services/PopupService.js";
import ScreenContextService from "/frontend/services/ScreenContextService.js";

//link components
import { MainPage } from "/frontend/components/MainPage/MainPage.js";
import { SolverHomePage } from "/frontend/components/SolverHomePage/SolverHomePage.js";
import { SolverVariablesPage } from "/frontend/components/SolverVariablesPage/SolverVariablesPage.js";
import { SolverEquationResultsPage } from "/frontend/components/SolverEquationResultPage/SolverEquationResultsPage.js";
import { SolverSolutionsChoicePage } from "/frontend/components/SolverSolutionsChoicePage/SolverSolutionsChoicePage.js";
import { PlotterSweeperConfigPage } from "/frontend/components/PlotterSweeperConfigPage/PlotterSweeperConfigPage.js";

window.app = {};
window.app.router = Router;
window.app.ScreenContextService = ScreenContextService.getInstance();
const app = window.app;

window.addEventListener("DOMContentLoaded", () => {
  console.log("App: DOMContentLoaded event listener callback");
  app.router.init();
});
