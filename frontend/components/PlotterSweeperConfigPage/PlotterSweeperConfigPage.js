import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";
import UiPopup from "../UiPopup/UiPopup.js";
import Handlers from "./Handlers.js";

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
  jsonPlotterPerformSweep;

  //previous data:
  jsonDataSolverHomePage;
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
    getConstantsObject() {
      const verifyFixedRefs = this.verifyFixed;
      const constantsData = {};
      let isOk = true;
      let errorMessage = "";
      for (let key in verifyFixedRefs) {
        if (key.startsWith("fixed-")) {
          const variableName = key.match(/fixed-(?<name>.+)/)?.groups?.name;
          let numValue;
          const value = verifyFixedRefs[key].current;
          numValue = Number(value);
          if (value === "" || Number.isNaN(numValue)) {
            isOk = false;
            errorMessage += `Constant ${variableName} has invalid value: "${value}". Please enter a valid number.\n`;
          }
          constantsData[variableName] = numValue;
        }
      }
      return { constantsData, isOk, errorMessage };
    },
    getRangeObject() {
      const performSweepRefs = this.performSweep;
      let rangeData = {};
      let isOk = true;
      let errorMessage = "";
      for (let key in performSweepRefs) {
        const value = performSweepRefs[key].current;
        const numValue = Number(value);
        rangeData[key] = numValue;
        if (rangeData[key] === "" || Number.isNaN(numValue)) {
          isOk = false;
          errorMessage += `Range setting ${key} has invalid value: "${rangeData[key]}". Please enter a valid number.\n`;
        }
      }
      return { rangeData, isOk, errorMessage };
    },
    performSweep: {
      start: {
        current: 0,
        selectionStart: 1,
        selectionEnd: 1,
        isFocused: false,
      },
      end: { current: 0, selectionStart: 1, selectionEnd: 1, isFocused: false },
      steps: {
        current: 200,
        selectionStart: 3,
        selectionEnd: 3,
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
  blockReferences = {
    formula: {
      current: "", //to be injected by addFormulaToVDOM(formula:"string");
    },
    sweeper: {
      isSuccess: false, //pending, success, error
      state: "pending",
      current: "?",
      className: "response-indicator pending", //we will change className based on status to change color and icon
    },
    fixed: {
      isSuccess: false,
      state: "pending",
      current: "?",
      className: "response-indicator pending",
    },
  };

  renderState = {
    hasFormulaVDOM: false,
    hasSweeperVDOM: false,
    hasFixedVDOM: false,
    hasRangeVDOM: false,
    hasPerformSweepVDOM: false,
  };

  dynamicVDOM = [
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
          tag: "stateful-box",
          className: "formula-value",
          id: "formula-to-sweep",
          stateRef: this.blockReferences.formula, //to be injected by addFormulaToSweepToDOM(formula:"string");
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
    //         //           id: "sweeper-option-t",
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
    //               id: "response-indicator-sweeper",
    //               stateRef: this.blockReferences.sweeper,
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
    //         //           type: "text",
    //         //           inputmode: "numeric",
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
    //                   stateRef: this.blockReferences.sweeper,
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
    //               type: "text",
    //               inputmode: "numeric",
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
    //               type: "text",
    //               inputmode: "numeric",
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
    //               type: "text",
    //               inputmode: "numeric",
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
    this.MyVDOMService.takeSnapshot(); //take snapshot of initial DOM state after first render
    this.statefulBuildVDOM("VDOM build in connectedCallback");
    this.updateScreenContext();
    this.MyVDOMService.updateDOM("connected callback after building VDOM");
    this.attachEventListeners();
  }
  disconnectedCallback() {
    console.log(`PlotterSweeperConfigPage: Disconnected from DOM, cleaning up`);
    this.renderState = {
      hasFormulaVDOM: false,
      hasSweeperVDOM: false,
      hasFixedVDOM: false,
      hasRangeVDOM: false,
      hasPerformSweepVDOM: false,
    };
    this.updateScreenContext();
    if (this.eventAbortController) {
      this.eventAbortController.abort();
      this.eventAbortController = null;
    }
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
    if (!this.data) {
      this.vDOM = VDOMService.createVDOM(this.dynamicVDOM);
      this.data = {
        vDOM: this.vDOM,
        prevVDOM: this.prevVDOM,
        elems: this.elems,
        dynamicVDOM: this.dynamicVDOM,
        onlySusceptible: false,
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
      this.jsonDataSolverHomePage =
        this.screenContextService.getSolverHomePageContext()?.json;
      this.jsonDataSolverVariablesPage =
        this.screenContextService.getSolverVariablesPageContext()?.json;
      this.jsonDataSolverSolutionsChoicePage =
        this.screenContextService.getSolverSolutionsChoicePageContext()?.json;
      this.MyVDOMService = new VDOMService(this.root, this.data);
      this.MyPopupService = new PopupService(this.root, this.data);
      this.screenContextService.setPlotterSweeperConfigPageContext(
        this.data,
        this.jsonPlotterPassSweeper,
        this.jsonPlotterVerifyFixed,
        this.jsonPlotterPerformSweep,
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
      this.jsonPlotterPerformSweep,
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
      jsonPlotterPerformSweep: this.jsonPlotterPerformSweep,
    } = plotterSweeperConfigPageContext);

    const plotterSweeperConfigPageData =
      plotterSweeperConfigPageContext.data || {};
    ({
      vDOM: this.vDOM,
      dynamicVDOM: this.dynamicVDOM,
      prevVDOM: this.prevVDOM,
    } = plotterSweeperConfigPageData);

    const solverHomePageContext =
      this.screenContextService.getSolverHomePageContext() || {};
    ({ json: this.jsonDataSolverHomePage } = solverHomePageContext);

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
  setCurrentFormula(formula) {
    this.blockReferences.formula.current = formula;
  }

  //helpers
  renderFormulaToSweep(solution) {
    if (solution) {
      this.setCurrentFormula(solution);
    } else {
      console.warn(
        "PlotterSweeperConfigPage: No formula provided to add to DOM",
      );
    }
  }
  renderSweeperVariableSelection(variableList) {
    if (variableList.length > 0) {
      const sweeperVariablesChoiceNode = {
        //susceptible
        tag: "section",
        className: "form-section",
        id: "sweeper-variable-section",
        children: [
          {
            tag: "h2",
            className: "form-section-title",
            textContent: "Select Sweeper Variable",
          },
          {
            tag: "fieldset",
            className: "sweeper-variables-grid",
            id: "sweeper-variables-group",
            children: [
              {
                tag: "legend",
                className: "sr-only",
                textContent: "Sweeper Variables",
              },
              //dynamically added here
            ],
          },
          {
            tag: "div",
            id: "actions-sweeper",
            children: [
              {
                tag: "button",
                type: "button",
                className: "pass-sweeper-button",
                id: "pass-sweeper-button",
                textContent: "Pass Sweeper",
              },
              {
                tag: "div",
                className: "response-block",
                id: "response-block-sweeper",
                children: [
                  {
                    tag: "stateful-box", //if response of api call is success, i need to make status success and display as green or smth like that, checkmark icon. if pending, then ? pending class ? icon, if error, red with white X sticker
                    id: "response-indicator-sweeper",
                    stateRef: this.blockReferences.sweeper,
                    className: "response-indicator pending",
                  },
                ],
              },
            ],
          },
        ],
      };
      //add variable options to fieldset
      const fieldset = sweeperVariablesChoiceNode.children[1].children;
      variableList.forEach((variable, index) => {
        //radioGroupReference init for each option
        const stateRef = (this.radioGroupReference.variables[
          `sweeper-option-${variable}`
        ] = {
          isChecked: false,
        });
        const variableOptionNode = {
          tag: "div",
          className: "sweeper-variable-option-container",
          id: `sweeper-option-container-${variable}`,
          children: [
            {
              tag: "label",
              className: "sweeper-variable-option",
              for: `sweeper-option-${variable}`,
              id: `sweeper-option-label-${variable}`,
              children: [
                {
                  tag: "input",
                  className: "sweeper-variable-input",
                  type: "radio",
                  name: "sweeper-variable",
                  id: `sweeper-option-${variable}`,
                  value: `${variable}`,
                  stateRef,
                },
                {
                  tag: "span",
                  className: "sweeper-variable-symbol",
                  textContent: `${variable}`,
                },
              ],
            },
          ],
        };
        fieldset.push(variableOptionNode);
      });
      this.dynamicVDOM.push(sweeperVariablesChoiceNode);
    } else {
      console.warn(
        "PlotterSweeperConfigPage: No variables available for sweeper selection",
      );
    }
  }
  renderFixedConstants(constantsList) {
    if (constantsList.length > 0) {
      const fixedConstantsNode = {
        tag: "section",
        className: "form-section form-section-alt",
        children: [
          {
            tag: "h2",
            className: "form-section-title",
            textContent: "Fixed Constants",
          },
          {
            tag: "div",
            className: "fixed-constants-grid",
            id: "fixed-constants-grid",
            children: [
              //content will be added dynamically based on constantsList
            ],
          },
          {
            tag: "div",
            className: "actions-constants",
            id: "actions-constants",
            children: [
              {
                tag: "button",
                type: "button",
                className: "verify-fixed-button",
                id: "verify-fixed-button",
                textContent: "Pass Fixed Constants",
              },
              {
                tag: "div",
                className: "response-block",
                id: "response-block",
                children: [
                  {
                    tag: "stateful-box",
                    id: "response-indicator-verify-fixed",
                    stateRef: this.blockReferences.sweeper,
                    className: "response-indicator pending",
                  },
                ],
              },
            ],
          },
        ],
      };
      //add constant input fields to grid
      const constantsGrid = fixedConstantsNode.children[1];
      constantsList.forEach((constant) => {
        //inputStateReferences init for each constant input
        const stateRef = (this.inputStateReferences.verifyFixed[
          `fixed-${constant}`
        ] = {
          current: "",
          selectionStart: 1,
          selectionEnd: 1,
          isFocused: false,
        });
        const constantInputNode = {
          tag: "div",
          id: `constant-${constant}`,
          children: [
            {
              tag: "div",
              className: "form-field",
              id: `constant-container-${constant}`,
              children: [
                {
                  tag: "label",
                  className: "form-label math-inline",
                  id: `const-label-${constant}`,
                  for: `const-${constant}`,
                  textContent: `${constant}`,
                },
                {
                  tag: "input",
                  className: "form-input",
                  id: `const-${constant}`,
                  type: "text",
                  inputmode: "numeric",
                  stateRef,
                },
              ],
            },
          ],
        };
        constantsGrid.children.push(constantInputNode);
      });
      this.dynamicVDOM.push(fixedConstantsNode);
    } else {
      console.warn(
        "PlotterSweeperConfigPage: No constants available for fixed constants section",
      );
    }
  }
  renderRangeSettings() {
    const rangeSettingsNode = {
      tag: "section",
      className: "form-section",
      id: "range-settings-section",
      children: [
        {
          tag: "h2",
          className: "form-section-title",
          textContent: "Range Settings",
        },
        {
          tag: "div",
          className: "range-settings-grid",
          id: "range-settings-grid",
          children: [
            {
              tag: "div",
              className: "form-input-range-wrapper",
              id: "range-start-container",
              children: [
                {
                  tag: "label",
                  className: "form-label",
                  for: "range-start",
                  id: "range-start-label",
                  textContent: "Start",
                },
                {
                  tag: "input",
                  className: "form-input-range",
                  id: "range-start",
                  type: "text",
                  inputmode: "numeric",
                  stateRef: this.inputStateReferences.performSweep.start,
                },
              ],
            },
            {
              tag: "div",
              className: "form-input-range-wrapper",
              id: "range-end-container",
              children: [
                {
                  tag: "label",
                  className: "form-label",
                  for: "range-end",
                  id: "range-end-label",
                  textContent: "End",
                },
                {
                  tag: "input",
                  className: "form-input-range",
                  id: "range-end",
                  type: "text",
                  inputmode: "numeric",
                  stateRef: this.inputStateReferences.performSweep.end,
                },
              ],
            },
            {
              tag: "div",
              className: "form-input-range-wrapper",
              id: "range-steps-container",
              children: [
                {
                  tag: "label",
                  className: "form-label",
                  for: "range-steps",
                  id: "range-steps-label",
                  textContent: "Steps",
                },
                {
                  tag: "input",
                  className: "form-input-range",
                  id: "range-steps",
                  type: "text",
                  inputmode: "numeric",
                  stateRef: this.inputStateReferences.performSweep.steps,
                },
              ],
            },
          ],
        },
      ],
    };
    const performSweepNode = {
      tag: "div",
      className: "actions-row",
      id: "perform-sweep-actions",
      children: [
        {
          tag: "button",
          className: "primary-action-button",
          id: "perform-sweep-button",
          type: "button",
          textContent: "Perform Sweep & Generate Plot",
        },
      ],
    };

    //add both nodes to dynamicVDOM so they will be rendered together at the end of the form
    this.dynamicVDOM.push(rangeSettingsNode);
    this.dynamicVDOM.push(performSweepNode);
  }

  //it will automatically know the state based on render state and himself decides what to render next.
  statefulBuildVDOM(tracebackMessage) {
    const state = this.renderState;
    const {
      hasFormulaVDOM,
      hasFixedVDOM,
      hasSweeperVDOM,
      hasRangeVDOM,
      hasPerformSweepVDOM,
    } = state;
    const {
      formula_string,
      target,
      is_const,
      is_one_var,
      is_multi_var,
      solution,
      required_list_str,
      required_list_final_str,
      sweeper,
      index,
    } = this.screenContextService.getCurrentDataState([
      "formula_string",
      "target",
      "is_const",
      "is_one_var",
      "is_multi_var",
      "solution",
      "required_list_str",
      "required_list_final_str",
      "sweeper",
      "index",
    ]);
    console.log(
      `PlotterSweeperConfigPage: Building VDOM - ${tracebackMessage}, state: ${JSON.stringify(state)}`,
    );
    if (!hasFormulaVDOM) {
      //always run if there is no
      this.renderFormulaToSweep(solution);
      state.hasFormulaVDOM = true;
      console.log(`PlotterSweeperConfigPage: Added formula to sweep to VDOM`);
    }
    if (
      //case1: sweeper should be chosen and there are vars to choose
      !hasSweeperVDOM &&
      required_list_str.length > 0 &&
      (is_one_var || is_multi_var)
    ) {
      this.renderSweeperVariableSelection(required_list_str);
      state.hasSweeperVDOM = true;
      console.log(
        `PlotterSweeperConfigPage: Added sweeper variable selection to VDOM`,
      );
      return;
    }

    //if there are conts to fix.
    if (!hasFixedVDOM && required_list_final_str.length > 0) {
      this.renderFixedConstants(required_list_final_str);
      state.hasFixedVDOM = true;
      console.log(
        `PlotterSweeperConfigPage: Added fixed constants section to VDOM`,
      );
      return;
    }

    if (!hasRangeVDOM && (sweeper || is_const)) {
      this.renderRangeSettings();
      state.hasRangeVDOM = true;
      console.log(`PlotterSweeperConfigPage: Added range settings to VDOM`);
      return;
    }
  }

  toggleBlockReferenceState(blockKey, newState) {
    const blockRef = this.blockReferences[blockKey];
    if (blockRef) {
      if (newState === "pending") {
        blockRef.state = "pending";
        blockRef.className = "response-indicator pending";
        blockRef.isSuccess = false;
        blockRef.current = "?";
      } else if (newState === "success") {
        blockRef.state = "success";
        blockRef.className = "response-indicator success";
        blockRef.isSuccess = true;
        blockRef.current = "✓";
      } else if (newState === "error") {
        blockRef.state = "error";
        blockRef.className = "response-indicator error";
        blockRef.isSuccess = false;
        blockRef.current = "✗";
      } else {
        console.warn(
          "PlotterSweeperConfigPage: Invalid state provided for block reference",
        );
      }
    }
  }
  applyInputStateChange(
    blockKey,
    variableKey,
    { current, selectionStart, selectionEnd, isFocused = true },
  ) {
    const blockRef = this.inputStateReferences[blockKey];
    if (blockRef) {
      const inputStateRef = blockRef[variableKey];
      if (inputStateRef) {
        console.warn(
          `PlotterSweeperConfigPage: Applying input state change for blockKey: ${blockKey}, variableKey: ${variableKey}, current: ${current}, selectionStart: ${selectionStart}, selectionEnd: ${selectionEnd}, isFocused: ${isFocused}`,
        );
        inputStateRef.current = current;
        inputStateRef.selectionStart = selectionStart;
        inputStateRef.selectionEnd = selectionEnd;
        inputStateRef.isFocused = isFocused;
      } else {
        console.warn(
          `PlotterSweeperConfigPage: Invalid variable key for input state reference, blockKey: ${blockKey}, variableKey: ${variableKey}, blockref: ${JSON.stringify(blockRef)}`,
        );
      }
    } else {
      console.warn(
        `PlotterSweeperConfigPage: Invalid block key for input state reference, blockKey: ${blockKey}, variableKey: ${variableKey}, inputStateReferences: ${JSON.stringify(this.inputStateReferences)}`,
      );
    }
  }
  attachEventListeners() {
    if (this.eventAbortController) {
      this.eventAbortController.abort();
    }
    this.eventAbortController = new AbortController();
    const { signal } = this.eventAbortController;

    //1.## radio buttons for variable selection.(radioGroupReference) $$
    //2. ##pass sweeper button: on click check for chosen vairable, if there is, api call. update blockreferences.sweeper after results came $$
    //
    //3.## two way data binding for const inputs. on input event, update inputStateReferences.verifyFixed[`fixed-${variableName}`].current and selectionStart, selectionEnd, isFocused.
    //4. ##verify fixed button    after api: blockReferences.fixed,
    //
    //5. ##two way data binding for range inputs
    //6. perform sweep button click -> gather all data(API.performSweep), api call, update screen with results, navigate to sweeper/plot_results. (there happens request blob. i need to investigate how can i show binary image to the screen)
    /////////////
    //1. radio buttons
    const radioGroupReference = this.radioGroupReference;
    this.root.addEventListener(
      "change",
      (event) => {
        const target = event.target;
        if (!target.matches(".sweeper-variable-input")) {
          return;
        }
        this.radioGroupReference = Handlers.handleRadioButtonChange(
          target,
          radioGroupReference,
        );
        console.log(
          `PlotterSweeperConfigPage: Sweeper variable selected - ${this.radioGroupReference.currentChosen}`,
        );
      },
      { signal },
    );
    //2. 4.
    this.root.addEventListener(
      "click",
      async (event) => {
        const target = event.target;
        const matchesPassSweeperButton = target.matches("#pass-sweeper-button");
        const matchesVerifyFixedButton = target.matches("#verify-fixed-button");
        const matchesPerformSweepButton = target.matches(
          "#perform-sweep-button",
        );
        if (
          !matchesPerformSweepButton &&
          !matchesPassSweeperButton &&
          !matchesVerifyFixedButton
        ) {
          console.warn(
            `PlotterSweeperConfigPage: Click event ignored, not a sweeper variable selection, pass sweeper button, verify fixed button, or perform sweep button click, item: `,
            target,
          );
          return;
        }
        if (matchesPassSweeperButton) {
          console.log(
            `PlotterSweeperConfigPage: Pass Sweeper button clicked, preparing to handle click event`,
          );
          await this.handlePassSweeperButtonClick(event);
        } else if (matchesVerifyFixedButton) {
          console.log(
            `PlotterSweeperConfigPage: VerifyFixed button clicked, preparing data for API call`,
          );
          await this.handleVerifyFixedConstantsButtonClick(event);
        } else if (matchesPerformSweepButton) {
          console.log(
            `PlotterSweeperConfigPage: Perform Sweep button clicked, preparing data for API call`,
          );
          await this.handlePerformSweepButtonClick(event);
        }
      },
      { signal },
    );

    //works, but i forgot to do focusing. it doesnt work. i need to investigate. also i need to add listeners to track the posistion of caret, just like i did in solverhomepage
    //3. 5. const inputs: two way data binding. input event-> update inputStateReferences.verifyFixed[`fixed-${variableName}`].current and selectionStart, selectionEnd, isFocused and updateVDOM
    this.root.addEventListener(
      "input",
      (event) => {
        const response = Handlers.handleInputChange(event);
        if (!response) {
          console.warn(
            `PlotterSweeperConfigPage: Input change event ignored, not a fixed or range input, ${response}`,
          );
          return;
        } else {
          this.MyVDOMService.takeSnapshot(); //take snapshot before state change for undo functionality
          this.applyInputStateChange(
            response.blockKey,
            `${response.name}`,
            response,
          );
          this.MyVDOMService.updateDOM(
            `after input change for ${response.name} changes to ${JSON.stringify(response)}`,
          );
        }
      },
      { signal },
    );
  }
  //2. pass sweeper button
  async handlePassSweeperButtonClick(event) {
    const targetEl = event.target;
    if (targetEl.matches(".pass-sweeper-button")) {
      console.log(
        `PlotterSweeperConfigPage: Pass Sweeper button clicked, preparing data for API call`,
      );
      const chosenVariable = this.radioGroupReference.currentChosen;
      if (!chosenVariable) {
        console.warn(
          `PlotterSweeperConfigPage: No sweeper variable chosen, cannot pass sweeper`,
        );
        this.toggleBlockReferenceState("sweeper", "error");
        this.MyVDOMService.updateDOM(
          "after failed attempt to pass sweeper due to no variable chosen",
        );
        this.MyPopupService.showErrorPopup(
          "Please select a variable to sweep.",
        );
        return;
      } else {
        try {
          this.MyVDOMService.takeSnapshot(); //take snapshot before state change for undo functionality
          this.toggleBlockReferenceState("sweeper", "pending");
          console.log(
            `PlotterSweeperConfigPage: Passing sweeper variable "${chosenVariable}" to API`,
          );
          const { formula_string, index, target } =
            this.jsonDataSolverSolutionsChoicePage ||
            this.jsonDataSolverVariablesPage ||
            this.jsonDataSolverHomePage ||
            {};
          const response = await API.passSweeper({
            formula_string,
            target,
            index,
            sweeper: chosenVariable,
          });
          if (!response.ok) {
            console.error(
              `PlotterSweeperConfigPage: API call to pass sweeper failed with status ${response.status}`,
            );
            this.toggleBlockReferenceState("sweeper", "error");
            this.MyVDOMService.updateDOM(
              "after failed attempt to pass sweeper due to API error",
            );
            this.MyPopupService.showErrorPopup(
              "Failed to pass the sweeper variable. Please try again.",
            );
            return;
          } else {
            const responseData = response.data || {};
            this.jsonPlotterPassSweeper = responseData; //update with any new data from response, in case we need it for next steps
            this.updateScreenContext();
            const { status_bool, required_list_final_str, error } =
              responseData;
            if (!status_bool) {
              console.error(
                `PlotterSweeperConfigPage: API response indicates failure - ${error}`,
              );
              this.toggleBlockReferenceState("sweeper", "error");
              this.MyPopupService.showErrorPopup(
                `Failed to pass the sweeper variable. Please check your selection and try again. Error: ${String(error)}`,
              );
              this.MyVDOMService.updateDOM(
                "after failed attempt to pass sweeper due to API error",
              );
              return;
            } else {
              console.log(
                `PlotterSweeperConfigPage: Sweeper variable passed successfully, updating VDOM with any required constants if provided`,
              );
              this.toggleBlockReferenceState("sweeper", "success");
              //if there are consts to fix, render fixed constants, else range. (statefulBuild can do it automatically)
              this.statefulBuildVDOM("after passing sweeper variable");
              this.updateScreenContext();
              this.MyVDOMService.updateDOM(
                `after passing sweeper variable and updating VDOM`,
              );
              console.log(
                `PlotterSweeperConfigPage: VDOM updated after passing sweeper variable`,
              );
            }
          }
        } catch (error) {
          console.error(
            `PlotterSweeperConfigPage: Error occurred while passing sweeper`,
            error,
          );

          this.MyVDOMService.updateDOM(
            "after failed attempt to pass sweeper due to error",
          );
          this.MyPopupService.showErrorPopup(
            "An error occurred while passing the sweeper.",
          );
        }
      }
    }
  }
  //4. verify fixed button click -> collect all the  data about fixed and api call.
  async handleVerifyFixedButtonClick(event) {
    const targetEl = event.target;
    const { constantsData, isOk, errorMessage } =
      this.inputStateReferences.getConstantsObject();
    this.MyVDOMService.takeSnapshot(); //take snapshot before state change for undo functionality
    if (!isOk) {
      console.warn(
        `PlotterSweeperConfigPage: Cannot verify fixed constants: Error: ${errorMessage}`,
      );
      this.toggleBlockReferenceState("fixed", "error");
      this.MyVDOMService.updateDOM(
        "after failed attempt to verify fixed constants due to incomplete inputs",
      );
      this.MyPopupService.showErrorPopup(
        `Please fill in all constant values before verifying. Error: ${errorMessage}`,
      );
      return;
    } else {
      try {
        this.toggleBlockReferenceState("fixed", "pending");
        const { formula_string, target, sweeper, index } =
          this.screenContextService.getCurrentDataState([
            "formula_string",
            "target",
            "sweeper",
            "index",
          ]);
        console.log(
          `PlotterSweeperConfigPage: Verifying fixed constants with API, data: ${JSON.stringify(constantsData)}`,
        );
        const response = await API.verifyFixed({
          formula_string,
          target,
          sweeper,
          index,
          fixed: constantsData,
        });
        if (!response.ok) {
          console.error(
            `PlotterSweeperConfigPage: API call to verify fixed constants failed with status ${response.status}`,
          );
          this.toggleBlockReferenceState("fixed", "error");
          this.MyVDOMService.updateDOM(
            "after failed attempt to verify fixed constants due to API error",
          );
          this.MyPopupService.showErrorPopup(
            "Failed to verify the fixed constants. Please try again.",
          );
        } else {
          const responseData = response.data || {};
          this.jsonPlotterVerifyFixed = responseData; //update with any new data from response, in case we need it for next steps
          this.updateScreenContext();
          const { status_bool, error } = responseData;
          if (!status_bool) {
            console.error(
              `PlotterSweeperConfigPage: API response indicates failure in verifying fixed constants - ${error}`,
            );
            this.toggleBlockReferenceState("fixed", "error");
            this.MyVDOMService.updateDOM(
              `after failed attempt to verify fixed constants due to verification error ${error.error}`,
            );
            this.MyPopupService.showErrorPopup(
              `Failed to verify the fixed constants. Please check your inputs and try again. Error: ${error.error}`,
            );
          } else {
            console.log(
              `PlotterSweeperConfigPage: Fixed constants verified successfully`,
            );
            this.toggleBlockReferenceState("fixed", "success");
            //render range settings if not rendered yet (statefulBuild can do it automatically based on new state)
            this.statefulBuildVDOM("after verifying fixed constants");
            this.updateScreenContext();
            this.MyVDOMService.updateDOM(
              `after verifying fixed constants and updating VDOM`,
            );
            console.log(
              `PlotterSweeperConfigPage: VDOM updated after verifying fixed constants`,
            );
          }
        }
      } catch (error) {
        console.error(
          `PlotterSweeperConfigPage: Error occurred while verifying fixed constants`,
          error,
        );
        this.MyVDOMService.updateDOM(
          "after failed attempt to verify fixed constants due to error",
        );
        this.MyPopupService.showErrorPopup(
          "An error occurred while verifying the fixed constants.",
        );
      }
    }
  }
  async handlePerformSweepButtonClick(event) {
    const targetEl = event.target;
    const { rangeData, isOk, errorMessage } =
      this.inputStateReferences.getRangeObject();
    if (!isOk) {
      console.warn(
        `PlotterSweeperConfigPage: Cannot perform sweep: Error: ${errorMessage}`,
      );
      this.MyPopupService.showErrorPopup(
        `Please fill in all range values before performing the sweep. Error: ${errorMessage}`,
      );
      return;
    }
    try {
      this.MyVDOMService.takeSnapshot(); //take snapshot before state change for undo functionality
      const { formula_string, target, sweeper, index, fixed } =
        this.screenContextService.getCurrentDataState([
          "formula_string",
          "target",
          "sweeper",
          "index",
          "fixed",
        ]);
      console.log(
        `PlotterSweeperConfigPage: Performing sweep with API, data: ${JSON.stringify(
          rangeData,
        )}`,
      );
      const response = await API.performSweep({
        formula_string,
        target,
        sweeper,
        index,
        fixed,
        range: rangeData,
      });
      var { status_bool, errorObj, ok, objectUrl } = response || {};
      if (!ok) {
        console.error(
          `PlotterSweeperConfigPage: API call to perform sweep failed with status ${response.status}, error: ${errorObj.error}`,
          response,
        );
        this.MyVDOMService.updateDOM(
          "after failed attempt to perform sweep due to API error",
        );
        this.MyPopupService.showErrorPopup(
          `Failed to perform the sweep. Please try again, ${errorObj.error}`,
        );
      } else if (objectUrl == undefined) {
        console.error(
          `PlotterSweeperConfigPage: API call to perform sweep succeeded but without objectUrl`,
        );
        this.MyVDOMService.updateDOM(
          "after failed attempt to perform sweep due to missing objectUrl",
        );
        this.MyPopupService.showErrorPopup(
          "Failed to perform the sweep. Please try again.",
        );
      } else {
        this.jsonPlotterPerformSweep = response; //update with any new data from response, in case we need it for next steps
        this.updateScreenContext();
        Router.go("/plotter/sweep_results");
      }
    } catch (error) {
      console.error(
        `PlotterSweeperConfigPage: Error occurred while performing sweep`,
        error,
      );
      this.MyVDOMService.updateDOM(
        "after failed attempt to perform sweep due to error",
      );
      this.MyPopupService.showErrorPopup(
        "An error occurred while performing the sweep.",
      );
    }
  }
}
customElements.define("plotter-sweeper-config-page", PlotterSweeperConfigPage);
