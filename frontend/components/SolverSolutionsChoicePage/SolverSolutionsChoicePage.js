import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";
//todo: later i will create so called Base element where i will declare these instance variabls and some of the methods
export class SolverSolutionsChoicePage extends HTMLElement {
  app = window.app || {};

  //services
  screenContextService = ScreenContextService.getInstance();
  MyVDOMService;
  MyPopupService;

  //data
  data;
  jsonDataSolverSolutionsChoicePage;

  //previous page (variables page, for taking solutions)
  jsonDataSolverVariablesPage;

  //dom and state references
  prevVDOM;
  vDOM;
  elems;

  radioGroupReference = {
    solution: "",
    solutionIndex: null,
    isChosen: false,
    //"solution_${index}": {isFocused: false}
  };
  // <template id="variable-option-template"> //each option for solution
  //     <div id="variable-option-container">
  //         <label class="variable-option">
  //             <input class="variable-input" type="radio" name="variable" id="" value="">
  //             <span class="variable-symbol"></span>
  //         </label>
  //     </div>
  // </template>

  dynamicVDOM = [
    {
      tag: "div",
      className: "formula-display",
      id: "current-formula",
      children: [
        {
          tag: "span",
          className: "formula-label",
          textContent: "CURRENT FORMULA",
        },
        {
          tag: "div",
          className: "formula-value",
          id: "formula-value",
          children: [], //here should be {tag: "span", textContent: this.jsonDataSolverVariablesPage?.formula}
        },
      ],
    },
    {
      tag: "div",
      className: "solutions-section",
      children: [
        {
          tag: "h1",
          className: "solutions-title",
          textContent: "Choose Solution to Explore",
        },
        {
          tag: "p",
          className: "solutions-subtitle",
          textContent:
            "The engine will plot and sweep based on the chosen solution ",
        },
      ],
    },
    {
      tag: "fieldset",
      className: "solutions-grid",
      id: "solutions-group",
      children: [
        { tag: "legend", className: "sr-only", textContent: "Solutions" },
      ], //here should be the solutions options, each option should be {tag: "div", className: "solution-option-container", children: [{tag: "label", className: "solution-option", children: [{tag: "input", className: "solution-input", type: "radio", name: "solution", id: "", value: ""}, {tag: "span", className: "solution-symbol", textContent: ""}]}]}
    },
    {
      tag: "div",
      className: "actions-row",
      children: [
        {
          tag: "button",
          className: "btn-back",
          id: "btn-back",
          type: "button",
          children: [
            {
              tag: "span",
              className: "back-text",
              ariaHidden: "true",
              textContent: "⬅️ Back",
            },
          ],
        },
        {
          tag: "button",
          className: "btn-solve",
          id: "btn-solve",
          type: "button",
          children: [
            {
              tag: "span",
              className: "solve-text",
              ariaHidden: "true",
              textContent: "Solve/explore ➡️",
            },
          ],
        },
      ],
    },
  ];

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.loadCSS();
    this.activateData();
  }
  connectedCallback() {
    console.log(`SolverSolutionsChoicePage: connectedCallback called`);
    this.MyVDOMService.updateDOM("connectedCallback, initial render");
    this.MyVDOMService.takeSnapshot(); //take snapshot after initial render to have the correct prevVDOM for the first update
    this.addFormulaToVDOM();
    this.addSolutionOptionsToVDOM();
    this.MyVDOMService.updateDOM(
      "connectedCallback, after adding formula and solutions to VDOM",
    );
    this.attachEventListeners();
  }
  disconnectedCallback() {
    console.log(`SolverSolutionsChoicePage: disconnectedCallback called`);
    this.updateScreenContext(); //update screen context before leaving the page to save the state
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
        susceptibleIndexes: [0, 2], //we will put here the index of the branch where we wave solutions grid, and choice
        popupState: {
          isVisible: false,
          message: "",
        },
        radioGroupReference: this.radioGroupReference,
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
  addFormulaToVDOM() {
    const formulaValueContainer = this.dynamicVDOM[0].children[1];
    if (
      formulaValueContainer &&
      this.jsonDataSolverVariablesPage?.formula_string
    ) {
      formulaValueContainer.children = [
        {
          tag: "span",
          className: "formula-text",
          textContent: this.jsonDataSolverVariablesPage.formula_string,
        },
      ];
    }
  }
  addSolutionOptionsToVDOM() {
    console.log(
      `SolverSolutionsChoicePage: Adding solution options to VDOM based on JSON data`,
    );
    const solutionsGroup = this.dynamicVDOM[2].children;
    console.log(
      `SolverSolutionsChoicePage: solutionsGroup reference obtained from dynamicVDOM`,
      solutionsGroup,
    );
    const solutionsOptions = this.jsonDataSolverVariablesPage?.solutions;
    console.log(
      `SolverSolutionsChoicePage: solutionsOptions extracted from JSON data`,
      solutionsOptions,
    );
    if (solutionsOptions && solutionsOptions.length > 1) {
      solutionsOptions.forEach((solution, index) => {
        const optionVDOM = {
          tag: "div",
          className: "solution-option-container",
          children: [
            {
              tag: "label",
              className: "solution-option",
              children: [
                {
                  tag: "input",
                  type: "radio",
                  className: "solution-input",
                  name: "solution",
                  value: index,
                  stateRef: (this.radioGroupReference[`solution_${index}`] = {
                    isFocused: false,
                  }),
                },
                {
                  tag: "span",
                  className: "solution-symbol",
                  textContent: solution,
                },
              ],
            },
          ],
        };
        solutionsGroup.push(optionVDOM);
      });
    }
  }
  setChosenSolution(solution, index) {
    this.data.radioGroupReference.solution = solution;
    this.data.radioGroupReference.isChosen = true;
    this.data.radioGroupReference.solutionIndex = index;
    console.log(
      `SolverSolutionsChoicePage: setChosenSolution called with solution ${solution}, radioGroupReference updated:`,
      this.data.radioGroupReference,
    );
  }

  attachEventListeners() {
    //1. event listener for back button, go back to results page
    //2. event listener for for solution options and keep updating radioGroupReference, in the same way it was done in variables page
    //3. event listener for solve button (check if chosen first, if not show popup, if chosen go to sweeper_configuration)

    //1. event listner for back button, go back to results page
    const btnBack = this.root.querySelector("#btn-back");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        this.updateScreenContext();
        Router.go("/solver/results");
      });
    }

    //2. event listener for for solution options and keep updating radioGroupReference, in the same way it was done in variables page
    const solutionInputs = this.root.querySelectorAll(".solution-input");
    solutionInputs.forEach((input, index) => {
      input.addEventListener("change", (event) => {
        const selectedSolution = event.target.value;
        console.log(
          `SolverSolutionsChoicePage: Solution option selected: ${selectedSolution}`,
        );
        this.setChosenSolution(selectedSolution, index);
        console.log(
          "SolverSolutionsChoicePage: Updated radioGroupReference in data:",
          this.data.radioGroupReference,
        );
      });
    });

    //3. event listener for solve button (check if chosen first, if not show popup, if chosen go to sweeper_configuration)
    const btnSolve = this.root.querySelector("#btn-solve");
    if (btnSolve) {
      btnSolve.addEventListener("click", async () => {
        if (
          !this.data.radioGroupReference.isChosen ||
          this.data.radioGroupReference.solution == ""
        ) {
          this.MyPopupService.showErrorPopup(
            "Please choose a solution to explore before proceeding.",
          );
        } else {
          this.updateScreenContext();
          //api request chooseSoltuion
          try {
            const responseData = await API.chooseSolution({
              formula_string: this.jsonDataSolverVariablesPage.formula_string,
              target: this.jsonDataSolverVariablesPage.target,
              index: this.data.radioGroupReference.solutionIndex,
            });
            if (responseData.ok) {
              console.log(
                `SolverSolutionsChoicePage: Solution chosen successfull`,
                responseData,
              );
            } else {
              console.error(
                "SolverSolutionsChoicePage: API call failed, response data:",
                responseData,
              );
              this.MyPopupService.showErrorPopup(
                "An error occurred while solving the equation. Please try again.",
              );
              return;
            }
            const jsonSolverSolutionsChoicePage = responseData.data;
            if (jsonSolverSolutionsChoicePage) {
              console.log(
                `SolverSolutionsChoicePage: Retrieved solution data:`,
                jsonSolverSolutionsChoicePage,
              );
              this.jsonDataSolverSolutionsChoicePage =
                jsonSolverSolutionsChoicePage;
              const { status_bool, index, solution, error } =
                jsonSolverSolutionsChoicePage || {};
              if (!status_bool) {
                console.warn(
                  `SolverSolutionsChoicePage: API response indicates failure, showing error ${error} popup`,
                );
                this.MyPopupService.showErrorPopup(
                  `Failed to solve for variable "${target}". Server responded with an error "${error}". Please check your formula and try again.`,
                );
                this.updateScreenContext();
                return;
              } else {
                console.log(
                  `SolverSolutionsChoicePage: API response indicates success, solution index: ${index}, solution: ${solution}`,
                );
                this.updateScreenContext();
                Router.go("/solver/sweeper_configuration");
              }
            } else {
              console.error(
                `SolverSolutionsChoicePage: No data received from API response, cannot proceed`,
              );
              this.MyPopupService.showErrorPopup(
                "An error occurred while processing the solution. Please try again.",
              );
            }
          } catch (e) {
            console.error(
              `SolverSolutionsChoicePage: Error in chooseSolution API request:`,
              e,
            );
            this.MyPopupService.showErrorPopup(
              "An error occurred while choosing the solution. Please try again.",
            );
          }
        }
      });
    }
  }
}

customElements.define(
  "solver-solutions-choice-page",
  SolverSolutionsChoicePage,
);
