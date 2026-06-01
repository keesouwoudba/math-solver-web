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
      //"fixed-[variableName]": {current: "", selectionStart: 0, selectionEnd:0, isFocused: false}
    },
    performSweep: {
      start: {
        current: 0,
        selectionStart: 0,
        selectionEnd: 0,
        isFocused: false,
      },
      end: { current: 0, selectionStart: 0, selectionEnd: 0, isFocused: false },
      step: {
        current: 200,
        selectionStart: 0,
        selectionEnd: 0,
        isFocused: false,
      },
    },
  };
  radioGroupReference = {
    currentChosen: "",
    chosenIndex: null,
    isChosen: false,
    variables: {
      //"sweeper-option-[variableName]": {isFocused: false}
    },
  };
  responseBlockReferences = {
    sweeper: {
      isSuccess: false, //pending, success, error
      state: "pending",
      current: "?",
    },
  };

  dynamicVDOM = [
    {
      //susceptioble index
      tag: "div",
      className: "formula-display",
      id: "current-formula",
      children: [
        {
          tag: "span",
          className: "formula-label",
          textContent: "YOUR FORMULA",
        },
        {
          tag: "div",
          className: "formula-value",
          id: "formula-to-sweep",
          textContent: "", //to be injected by addFormulaToSweepToDOM(formula:"string");
        },
      ],
    },
    {
      tag: "div",
      className: "configuration-section",
      children: [
        {
          tag: "h1",
          className: "configuration-title",
          textContent: "Configure Your Sweep",
        },
        {
          tag: "p",
          className: "configuration-subtitle",
          textContent:
            "Define parameters to visualize functional behavior over a set domain.",
        },
      ],
    },
    // { //will be added if there are variables to choose for sweeper
    //   //susceptible
    //   tag: "section",
    //   className: "form-section",
    //   id: "sweeper-variable-section",
    //   children: [
    //     {
    //       tag: "h2",
    //       className: "form-section-title",
    //       textContent: "Select Sweeper Variable",
    //     },
    //     {
    //       tag: "fieldset",
    //       className: "sweeper-variables-grid",
    //       id: "sweeper-variables-group",
    //       children: [
    //         {
    //           tag: "legend",
    //           className: "sr-only",
    //           textContent: "Sweeper Variables",
    //         },
    //         //template that will be dynamically added as variable options:
    //         // {
    //         //   tag: "div",
    //         //   className: "sweeper-variable-option-container",
    //         //   children: [
    //         //     {
    //         //       tag: "label",
    //         //       className: "sweeper-variable-option",
    //         //       children: [
    //         //         {
    //         //           tag: "input",
    //         //           className: "sweeper-variable-input",
    //         //           type: "radio",
    //         //           name: "sweeper-variable",
    //         //           id: "sweeper-var-t",
    //         //           value: "t",
    //         //         },
    //         //         {tag: "span", className: "sweeper-variable-symbol", textContent: "t"}
    //         //       ],
    //         //     },
    //         //   ],
    //         // },
    //       ],
    //     },
    //     {
    //       tag: "div",
    //       id: "actions-sweeper",
    //       children: [
    //         {
    //           tag: "button",
    //           type: "button",
    //           className: "pass-sweeper-button",
    //           textContent: "Pass Sweeper",
    //         },
    //         {
    //           tag: "div",
    //           className: "response-block",
    //           id: "response-block-sweeper",
    //           children: [
    //             {
    //               tag: "stateful-box", //if response of api call is success, i need to make status success and display as green or smth like that, checkmark icon. if pending, then ? pending class ? icon, if error, red with white X sticker
    //               className: "response-indicator pending",
    //               id: "response-indicator-sweeper",
    //               stateRef: this.responseBlockReferences.sweeper,
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },
    ///////////////////////////////
    //susceptioble index
    // { //will be added if there are consants to fix
    //   tag: "section",
    //   className: "form-section form-section-alt",
    //   children: [
    //     {
    //       tag: "h2",
    //       className: "form-section-title",
    //       textContent: "Fixed Constants",
    //     },
    //     {
    //       tag: "div",
    //       className: "fixed-constants-grid",
    //       children: [
    //         // { //will be added for each constant that needs to be fixed
    //         //   tag: "div",
    //         //   id: "constants-container",
    //         //   children: [
    //         //     {
    //         //       tag: "div",
    //         //       className: "form-field",
    //         //       children: [
    //         //         {
    //         //           tag: "label",
    //         //           className: "form-label math-inline",
    //         //           for: "const-v",
    //         //           textContent: "v",
    //         //         },
    //         //         {
    //         //           tag: "input",
    //         //           className: "form-input",
    //         //           id: "const-v",
    //         //           type: "number",
    //         //           value: "10",
    //         //         },
    //         //       ],
    //         //     },
    //         //   ],
    //         // },
    //         {
    //           tag: "div",
    //           id: "actions-constants",
    //           children: [
    //             {
    //               tag: "button",
    //               type: "button",
    //               className: "pass-sweeper-button",
    //               textContent: "Pass Constants",
    //             },
    //             {
    //               tag: "div",
    //               className: "response-block",
    //               children: [
    //                 {
    //                   tag: "stateful-box",
    //                   className: "response-indicator pending",
    //                   stateRef: this.responseBlockReferences.sweeper,
    //                   textContent: "?",
    //                 },
    //               ],
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },
    //////////////////////////////
    //will be added if there was a sweeper. at least one var
    //     <!-- Section: Range Settings -->
    // {
    //   tag: "section",
    //   className: "form-section",
    //   id: "range-settings-section",
    //   children: [
    //     {
    //       tag: "h2",
    //       className: "form-section-title",
    //       textContent: "Range Settings",
    //     },
    //     {
    //       tag: "div",
    //       className: "range-settings-grid",
    //       children: [
    //         {
    //           tag: "div",
    //           className: "form-input-range-wrapper",
    //           children: [
    //             {
    //               tag: "label",
    //               className: "form-label",
    //               for: "range-start",
    //               textContent: "Start",
    //             },
    //             {
    //               tag: "input",
    //               className: "form-input-range",
    //               id: "range-start",
    //               type: "number",
    //               value: "0",
    //             },
    //           ],
    //         },
    //         {
    //           tag: "div",
    //           className: "form-input-range-wrapper",
    //           children: [
    //             {
    //               tag: "label",
    //               className: "form-label",
    //               for: "range-end",
    //               textContent: "End",
    //             },
    //             {
    //               tag: "input",
    //               className: "form-input-range",
    //               id: "range-end",
    //               type: "number",
    //               value: "100",
    //             },
    //           ],
    //         },
    //         {
    //           tag: "div",
    //           className: "form-input-range-wrapper",
    //           children: [
    //             {
    //               tag: "label",
    //               className: "form-label",
    //               for: "range-steps",
    //               textContent: "Steps",
    //             },
    //             {
    //               tag: "input",
    //               className: "form-input-range",
    //               id: "range-steps",
    //               type: "number",
    //               value: "50",
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },
    /////////////////////
    //will be always added at the end
    // {
    //   tag: "div",
    //   className: "actions-row",
    //   children: [
    //     {
    //       tag: "button",
    //       className: "primary-action-button",
    //       type: "button",
    //       children: [
    //         { tag: "span", textContent: "Perform Sweep & Generate Plot" },
    //       ],
    //     },
    //   ]
    // },
  ];

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.loadCSS();
    this.activateData();
  }
  connectedCallback() {
    console.log(`PlotterSweeperConfigPage: Connected to DOM, rendering VDOM`);
    this.MyVDOMService.updateDOM("connected callback initial render");
  }
  disconnectedCallback() {
    console.log(`PlotterSweeperConfigPage: Disconnected from DOM, cleaning up`);
    this.updateScreenContext();
  }

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
  addFormulaToSweepToDOM() {}
}
