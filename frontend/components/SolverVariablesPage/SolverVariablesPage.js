export class SolverVariablesPage extends HTMLElement {
  data;
  SolverHomePageData;
  jsonDataSolverVariablesPage = {};
  jsonDataSolverHomePage;
  app;

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
    this.app = window.app || {};
    this.jsonDataSolverHomePage = this.app.jsonDataSolverHomePage || {};
    console.log(
      "SolverVariablesPage: jsonDataSolverHomePage =",
      this.jsonDataSolverHomePage,
    );
    this.data = {
      jsonDataSolverVariablesPage: this.jsonDataSolverVariablesPage,
      radioGroupReference: this.radioGroupReference,
    };
    this.app.SolverVariablesPageData = this.data;
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
    const variables = this.jsonDataSolverHomePage.variables || [];
    console.log(
      `SolverVariablesPage: Variables from SolverHomePage data: ${variables.join(", ")}`,
    );
    variables.forEach((variable) => {
      const variableContent = variableTemplate.content.cloneNode(true);
      variablesGroup.appendChild(variableContent);
      //stopped here: variables dont show up
      const input = variableContent.querySelector(".variable-input");
      const symbol = variableContent.querySelector(".variable-symbol");
      if (input && symbol) {
        input.value = variable;
        input.id = `variable-${variable}`;
        symbol.textContent = variable;
      } else {
        console.warn(
          `SolverVariablesPage: Missing input or symbol element for variable ${variable}`,
        );
      }
    });
  }
  attachEventListeners() {
    console.log("SolverVariablesPage: Attaching event listeners");
    // 1. as soon as variable option is chosen in radio, update state
    //2. event listener for back button (go back to solver home page using router, while preserving its previous state(calling updateVDOM with previous state data. make a method inside component so that it would expose random updateVDOM))
    //3. event listener for solve button (call api, and again save everythng to global app object)
  }
}

customElements.define("solver-variables-page", SolverVariablesPage);
