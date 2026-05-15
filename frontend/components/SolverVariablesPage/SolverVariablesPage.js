import Router from "../../services/Router.js";
import ScreenContextService from "../../services/ScreenContextService.js";

export class SolverVariablesPage extends HTMLElement {
  app = window.app || {};

  //services
  screenContextService = ScreenContextService.getInstance(); //object starts with lowercase
  MyPopupService;

  //data
  data; //SolverVariablesPageData
  jsonDataSolverVariablesPage;

  //from previous SolverHomePage
  SolverHomePageData;
  jsonDataSolverHomePage;

  radioGroupReference = {
    current: "",
    chosen: false,
  };
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.loadCss();
    this.initData();
  }
  loadCss() {
    console.log("SolverVariablesPage: Loading CSS for the component");
    const styles = document.createElement("style");
    styles.setAttribute("data-solver-variables", "");
    styles.textContent = `@import "/frontend/components/SolverVariablesPage/SolverVariablesPage.css";`;
    this.root.appendChild(styles);
    console.log("SolverVariablesPage: CSS loaded and appended to shadow root");
  }
  initData() {
    console.log("SolverVariablesPage: Initializing data for the component");

    //get data from global app object (set by previous page)
    const SolverVariablesScreenContext =
      this.screenContextService.getSolverVariablesPageData();
    this.SolverHomePageData =
      this.screenContextService.getSolverHomePageData()?.data || {};
    this.jsonDataSolverHomePage =
      this.screenContextService.getSolverHomePageData()?.json || {};

    this.data = {
      jsonDataSolverVariablesPage: this.jsonDataSolverVariablesPage,
      radioGroupReference: this.radioGroupReference,
    };
    console.log(
      "SolverVariablesPage: Data initialized and stored in global app object",
    );
  }

  connectedCallback() {
    this.render();
  }

  render() {
    console.log("SolverVariablesPage: render called");
    const pageTemplate = document.querySelector("#solver-variables-template");

    if (!pageTemplate) {
      console.error("SolverVariablesPage: Required templates not found");
      return;
    }
    const pageContent = pageTemplate.content.cloneNode(true);
    const styleElement = this.root.querySelector(
      "style[data-solver-variables]",
    );
    this.root.replaceChildren(styleElement, pageContent);
    this.setCurrentFormula();
    this.addVariableOptions();
    this.attachEventListeners();
    console.log("SolverVariablesPage: Render completed");
  }

  setCurrentFormula() {
    const formula =
      this.jsonDataSolverHomePage.formula_string ||
      this.jsonDataSolverHomePage.formula ||
      "";
    console.log(
      `SolverVariablesPage: Setting current formula in data: ${formula}`,
    );
    this.data.currentFormula = formula;

    const currentFormulaElement = this.root.querySelector("#formula-value");
    if (currentFormulaElement) {
      currentFormulaElement.textContent = formula;
    } else {
      console.warn("SolverVariablesPage: #formula-value element not found");
    }
  }

  addVariableOptions() {
    console.log("SolverVariablesPage: Adding variable options to the page");

    const variables = this.jsonDataSolverHomePage.variables || [];
    console.log(
      `SolverVariablesPage: Variables from SolverHomePage data: ${variables.join(", ")}`,
    );

    const variableTemplate = document.querySelector(
      "#variable-option-template",
    );
    const variablesGroup = this.root.querySelector("#variables-group");
    if (!variablesGroup || !variableTemplate) {
      console.error(
        "SolverVariablesPage: #variables-group not found or #variable-option-template missing",
      );
      return;
    }
    console.log(
      `SolverVariablesPage: Found variables group ${variablesGroup} and variable option template , ${variableTemplate}`,
    );

    variables.forEach((variable) => {
      const variableContent = variableTemplate.content.cloneNode(true);
      console.log(variableContent);
      //stopped here: variables dont show up
      const input = variableContent.querySelector(".variable-input");
      console.log(
        `SolverVariablesPage: Processing variable "${variable}", input element:`,
        input,
      );
      const symbol = variableContent.querySelector(".variable-symbol");
      console.log(
        `SolverVariablesPage: Processing variable "${variable}", symbol element:`,
        symbol,
      );
      if (input && symbol) {
        console.log(
          `SolverVariablesPage: Setting input value and symbol text for variable "${variable}"`,
        );
        input.value = variable;
        symbol.textContent = variable;
      } else {
        console.warn(
          `SolverVariablesPage: Missing input or symbol element for variable ${variable}`,
        );
      }
      variablesGroup.appendChild(variableContent);
    });
  }
  attachEventListeners() {
    console.log("SolverVariablesPage: Attaching event listeners");
    // 1. as soon as variable option is chosen in radio, update state object data.radioGroupReference.current and data.radioGroupReference.chosen to true, and save it to global app object (so that it can be used in solver home page when user goes back)
    //2. event listener for back button (go back to solver home page using router, while preserving its previous state(calling updateVDOM with previous state data. make a method inside component so that it would expose random updateVDOM))
    //3. event listener for solve button (call api, and again save everythng to global app object)

    //1. event listener for variable options
    const variableInputs = this.root.querySelectorAll(".variable-input");
    variableInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        const selectedVariable = event.target.value;
        console.log(
          `SolverVariablesPage: Variable option selected: ${selectedVariable}`,
        );
        this.data.radioGroupReference.current = selectedVariable;
        this.data.radioGroupReference.chosen = true;
        console.log(
          "SolverVariablesPage: Updated radioGroupReference in data:",
          this.data.radioGroupReference,
        );
      });
    });

    //2. event listener for back button
    const backButton = this.root.querySelector("#btn-back");
    if (backButton) {
      backButton.addEventListener("click", () => {
        console.log(
          "SolverVariablesPage: Back button clicked, navigating to SolverHomePage",
        );
        Router.go("/solver");
      });
    }
  }
}

customElements.define("solver-variables-page", SolverVariablesPage);
