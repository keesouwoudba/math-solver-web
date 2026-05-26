import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";

export class SolverSolutionsChoicePage extends HTMLElement {
  app = window.app || {};

  //services
  screenContextService = ScreenContextService.getInstance();
  MyVDOMService;
  MyPopupService;

  //data
  data;

  //previous page (variables page, for taking solutions)
  jsonDataSolverVariablesPage;

  //dom and state references
  prevVDOM;
  vDOM;
  elems;

  //a page similar to solver variables, but choosing solutions
  dynamicVDOM = [];

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.loadCSS();
    this.activateData();
  }

  loadCSS() {
    console.log(
      `SolverSolutionsChoicePage: Loading CSS for SolverSolutionsChoicePage`,
    );
    const styles = document.createElement("style");
    styles.textContent = `@import "/frontend/components/SolverSolutionsChoicePage/SolverSolutionsChoicePage.css";`;
    this.root.appendChild(styles);
    console.log(
      `SolverSolutionsChoicePage: CSS loaded for SolverSolutionsChoicePage`,
    );
  }

  activateData() {
    if (
      !this.data &&
      !ScreenContextService.getInstance().SolverSolutionsChoicePageData
    ) {
      this.vDOM = VDOMService.createVDOM(this.dynamicVDOM);
      this.data = {
        vDOM: this.vDOM,
        prevVDOM: this.prevVDOM,
        elems: this.elems,
        dynamicVDOM: this.dynamicVDOM,
        onlySusceptible: true,
        susceptibleIndexes: [], //we will put here the index of the branch where we wave solutions grid, and choice
        popupState: {
          isVisible: false,
          message: "",
        },
        solutions: [],
        jsonDataSolverSolutionsChoicePage:
          this.jsonDataSolverSolutionsChoicePage,
        MyVDOMService: this.MyVDOMService,
        MyPopupService: this.MyPopupService,
      };
      this.jsonDataSolverVariablesPage =
        this.screenContextService.getSolverVariablesPageContext()?.json;
      this.MyVDOMService = new VDOMService(this.root, this.data);
      this.MyPopupService = new PopupService(this.root, this.data);
      this.screenContextService.setSolverSolutionsChoicePageContext(
        this.data,
        this.jsonDataSolverSolutionsChoicePage,
      );
      console.log(
        `SolverSolutionsChoicePage: VDOM activated and services initialized`,
      );
    } else {
      //recreate state from screen context service
      this.recreateStateFromScreenContext();
    }
  }
  updateScreenContext() {
    this.screenContextService.setSolverSolutionsChoicePageContext(
      this.data,
      this.jsonDataSolverSolutionsChoicePage,
    );
    console.log(
      `SolverSolutionsChoicePage: Screen context updated with current data and JSON`,
    );
  }
  recreateStateFromScreenContext() {
    const solverSolutionsChoicePageContext =
      this.screenContextService.getSolverSolutionsChoicePageContext() || {};
    //destructure data and json from context
    ({ data: this.data, json: this.jsonDataSolverSolutionsChoicePage } =
      solverSolutionsChoicePageContext);

    const solverSolutionsChoicePageData =
      solverSolutionsChoicePageContext.data || {};
    ({ vDOM: this.vDOM, prevVDOM: this.prevVDOM } =
      solverSolutionsChoicePageData);

    const solverVariablesPageContext =
      this.screenContextService.getSolverVariablesPageContext() || {};
    ({ json: this.jsonDataSolverVariablesPage } = solverVariablesPageContext);

    this.elems = undefined; //to be recreated by VDOMService
    this.data.elems = this.elems; //just in case

    this.MyVDOMService = new VDOMService(this.root, this.data);
    this.MyPopupService = new PopupService(this.root, this.data);

    this.data.MyVDOMService = this.MyVDOMService; //to make sure data has the reference to the new instance of VDOMService
    this.data.MyPopupService = this.MyPopupService; //to make sure data has the reference to the new instance of PopupService

    console.log(
      `SolverSolutionsChoicePage: State recreated from screen context with data and JSON`,
    );
  }
}

customElements.define(
  "solver-solutions-choice-page",
  SolverSolutionsChoicePage,
);
