export default class ScreenContextService {
  app = window.app || {};

  //solverHomePage
  SolverHomePageData;
  jsonDataSolverHomePage;
  solverHomePageHasContext;

  //solverVariablesPage
  SolverVariablesPageData;
  jsonDataSolverVariablesPage;
  constructor() {
    console.log("ScreenContextService: Initializing service");
    window.app.ScreenContextService = this;
    console.log(
      "ScreenContextService: Service instance stored in global app object",
    );
  }

  static getInstance() {
    if (!window.app.ScreenContextService) {
      console.log("ScreenContextService: Creating new instance");
      window.app.ScreenContextService = new ScreenContextService();
    } else {
      console.log("ScreenContextService: Returning existing instance");
    }
    return window.app.ScreenContextService;
  }

  setSolverHomePageData(data, json, hasContext = true) {
    console.log("ScreenContextService: Setting SolverHomePage data and JSON");
    this.SolverHomePageData = data;
    this.jsonDataSolverHomePage = json;
    this.solverHomePageHasContext = hasContext;
    console.log("ScreenContextService: Data and JSON set for SolverHomePage");
  }
  getSolverHomePageData() {
    console.log("ScreenContextService: Getting SolverHomePage data and JSON");
    return {
      data: this.SolverHomePageData,
      json: this.jsonDataSolverHomePage,
    };
  }

  setSolverVariablesPageData(data, json, hasContext = true) {
    console.log(
      "ScreenContextService: Setting SolverVariablesPage data and JSON",
    );
    this.SolverVariablesPageData = data;
    this.jsonDataSolverVariablesPage = json;
    this.solverVariablesPageHasContext = hasContext;
    console.log(
      "ScreenContextService: Data and JSON set for SolverVariablesPage",
    );
  }
  getSolverVariablesPageData() {
    console.log(
      "ScreenContextService: Getting SolverVariablesPage data and JSON",
    );
    return {
      data: this.SolverVariablesPageData,
      json: this.jsonDataSolverVariablesPage,
    };
  }
}
