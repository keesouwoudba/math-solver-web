import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";
import UiPopup from "../UiPopup/UiPopup.js";

export class PlotterSweeperConfigPage extends HTMLElement {
  app = window.app || {};

  //services
  screenContextService = ScreenContextService.getInstance(); //object starts with lowercase
  MyVDOMService;
  MyPopupService;
  eventAbortController;

  //data
  data;
  jsonPlotterPassSweeper;
  jsonPlotterVerifyFixed;

  //previous data:
  jsonDataSolverVariablesPage;
  jsonDataSolverSolutionsChoicePage;

  //dom and state references
  prevDOM;
  vDOM;
  elems;

  inputStateReferences = {
    verifyFixed: {
      //example  "fixed-[variableName]": {current: "", selectionStart: 0, selectionEnd:0, isFocused: false}
    },
  };
  radioGroupReference = {
    currentChosen: "",
    chosenIndex: null,
    isChosen: false,
    //"sweeper-option-[variableName]": {isFocused: false}
  };
  dynamicVDOM = [];

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.loadCSS();
    this.activateData();
  }
  connectedCallback() {}
  disconnectedCallback() {}

  loadCSS() {
    console.log(
      `PlotterSweeperConfigPage: Loading CSS for PlotterSweeperConfigPage`,
    );
    const styles = document.createElement("style");
    styles.textContent = `@import "/frontend/components/PlotterSweeperConfigPage/PlotterSweeperConfigPage.css";`;
    this.root.appendChild(styles);
    console.log(
      `PlotterSweeperConfigPage: CSS loaded for PlotterSweeperConfigPage`,
    );
  }
  activateData() {
    if (
      !this.data &&
      !ScreenContextService.getInstance().PlotterSweeperConfigPageData
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
        radioGroupReference: this.radioGroupReference,
        inputStateReferences: this.inputStateReferences,
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
      this.screenContextService.setPlotterSweeperConfigPageContext(
        this.data,
        this.jsonPlotterPassSweeper,
        this.jsonPlotterVerifyFixed,
      );
      console.log(
        `PlotterSweeperConfigPage: VDOM activated and services initialized`,
      );
    } else {
      //recreate state from screen context service
      this.recreateStateFromScreenContext();
    }
  }
  updateScreenContext() {
    console.log(
      "PlotterSweeperConfigPage: Updating screen context with current data and JSON",
    );
    this.screenContextService.setPlotterSweeperConfigPageContext(
      this.data,
      this.jsonPlotterPassSweeper,
      this.jsonPlotterVerifyFixed,
    );
  }
  recreateStateFromScreenContext() {
    console.log(
      "PlotterSweeperConfigPage: Recreating state from screen context",
    );
    const plotterSweeperConfigPageContext =
      this.screenContextService.getPlotterSweeperConfigPageContext() || {};
    ({
      data: this.data,
      jsonPassSweeper: this.jsonPlotterPassSweeper,
      jsonVerifyFixed: this.jsonPlotterVerifyFixed,
    } = plotterSweeperConfigPageContext);

    const plotterSweeperConfigPageData =
      plotterSweeperConfigPageContext.data || {};
    ({ vDOM: this.vDOM, prevVDOM: this.prevVDOM } =
      plotterSweeperConfigPageData);

    const solverVariablesPageContext =
      this.screenContextService.getSolverVariablesPageContext() || {};
    ({ json: this.jsonDataSolverVariablesPage } = solverVariablesPageContext);

    const solverSolutionsChoicePageContext =
      this.screenContextService.getSolverSolutionsChoicePageContext() || {};
    ({ json: this.jsonDataSolverSolutionsChoicePage } =
      solverSolutionsChoicePageContext);

    this.elems = undefined; //we will recreate elems from vDOM
    this.data.elems = this.elems; //just in case

    this.MyVDOMService = new VDOMService(this.root, this.data);
    this.MyPopupService = new PopupService(this.root, this.data);

    this.data.MyVDOMService = this.MyVDOMService; //to make sure data has the reference to the new instance of VDOMService
    this.data.MyPopupService = this.MyPopupService; //to make sure data has the reference to the new instance of PopupService

    console.log(
      "PlotterSweeperConfigPage: State recreated from screen context",
    );
  }
}
