export default class ScreenContextService {
  app = window.app || {};

  //solverHomePage
  SolverHomePageData;
  jsonDataSolverHomePage;
  solverHomePageHasContext;

  //solverVariablesPage
  SolverVariablesPageData;
  jsonDataSolverVariablesPage;
  solverVariablesPageHasContext;

  //solverEquationResultsPage
  SolverEquationResultsPageData;
  jsonDataSolverEquationResultsPage;
  solverEquationResultsPageHasContext;

  //solverSolutionsChoicePage
  SolverSolutionsChoicePageData;
  jsonDataSolverSolutionsChoicePage;
  solverSolutionsChoicePageHasContext;

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

  setSolverHomePageContext(data, json, hasContext = true) {
    console.log("ScreenContextService: Setting SolverHomePage data and JSON");
    this.SolverHomePageData = data;
    this.jsonDataSolverHomePage = json;
    this.solverHomePageHasContext = hasContext;
    console.log("ScreenContextService: Data and JSON set for SolverHomePage");
  }
  getSolverHomePageContext() {
    console.log("ScreenContextService: Getting SolverHomePage data and JSON");
    return {
      data: this.SolverHomePageData,
      json: this.jsonDataSolverHomePage,
    };
  }

  setSolverVariablesPageContext(data, json, hasContext = true) {
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
  getSolverVariablesPageContext() {
    console.log(
      "ScreenContextService: Getting SolverVariablesPage data and JSON",
    );
    return {
      data: this.SolverVariablesPageData,
      json: this.jsonDataSolverVariablesPage,
    };
  }

  setSolverEquationResultsPageContext(data, json, hasContext = true) {
    console.log(
      "ScreenContextService: Setting SolverEquationResultsPage data and JSON",
    );
    this.SolverEquationResultsPageData = data;
    this.jsonDataSolverEquationResultsPage = json;
    this.solverEquationResultsPageHasContext = hasContext;
    console.log(
      "ScreenContextService: Data and JSON set for SolverEquationResultsPage",
    );
  }
  getSolverEquationResultsPageContext() {
    console.log(
      "ScreenContextService: Getting SolverEquationResultsPage data and JSON",
    );
    return {
      data: this.SolverEquationResultsPageData,
      json: this.jsonDataSolverEquationResultsPage,
    };
  }

  setSolverSolutionsChoicePageContext(data, json, hasContext = true) {
    console.log(
      "ScreenContextService: Setting SolverSolutionsChoicePage data and JSON",
    );
    this.SolverSolutionsChoicePageData = data;
    this.jsonDataSolverSolutionsChoicePage = json;
    this.solverSolutionsChoicePageHasContext = hasContext;
    console.log(
      "ScreenContextService: Data and JSON set for SolverSolutionsChoicePage",
    );
  }
  getSolverSolutionsChoicePageContext() {
    console.log(
      "ScreenContextService: Getting SolverSolutionsChoicePage data and JSON",
    );
    return {
      data: this.SolverSolutionsChoicePageData,
      json: this.jsonDataSolverSolutionsChoicePage,
    };
  }

  resetScreenContext() {
    console.log("ScreenContextService: Resetting all screen contexts");
    this.SolverHomePageData = undefined;
    this.jsonDataSolverHomePage = undefined;
    this.solverHomePageHasContext = false;

    this.SolverVariablesPageData = undefined;
    this.jsonDataSolverVariablesPage = undefined;
    this.solverVariablesPageHasContext = false;

    this.SolverEquationResultsPageData = undefined;
    this.jsonDataSolverEquationResultsPage = undefined;
    this.solverEquationResultsPageHasContext = false;

    console.log("ScreenContextService: All screen contexts reset");
  }
}
