import Router from "../../services/Router.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import PopupService from "../../services/PopupService.js";
import API from "../../services/API.js";

//tomake: cleanup this code
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
    isChosen: false,
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
      this.screenContextService.getSolverVariablesPageContext();

    this.SolverHomePageData =
      this.screenContextService.getSolverHomePageContext()?.data || {};
    this.jsonDataSolverHomePage =
      this.screenContextService.getSolverHomePageContext()?.json || {};

    this.data = {
      jsonDataSolverVariablesPage: this.jsonDataSolverVariablesPage,
      radioGroupReference: this.radioGroupReference,
      popupState: {
        isVisible: false,
        message: "",
      },
      currentFormula: "",
    };
    this.MyPopupService = new PopupService(this.root, this.data);
    console.log(
      "SolverVariablesPage: Data initialized and stored in global app object",
    );
  }
  updateScreenContext() {
    console.log(
      "SolverVariablesPage: Updating screen context with current data",
    );
    this.screenContextService.setSolverVariablesPageContext({
      data: this.data,
      json: this.jsonDataSolverVariablesPage,
    });
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
  setChosenVariable(variable) {
    console.log(
      `SolverVariablesPage: Setting chosen variable to "${variable}" in radioGroupReference`,
    );
    this.data.radioGroupReference.current = variable;
    this.data.radioGroupReference.isChosen = true;
    console.log(
      "SolverVariablesPage: Updated radioGroupReference in data:",
      this.data.radioGroupReference,
    );
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
      if (
        this.radioGroupReference.isChosen &&
        this.radioGroupReference.current == variable
      ) {
        console.log(
          `SolverVariablesPage: Pre-selecting variable "${variable}" based on radioGroupReference`,
        );
        input.checked = true;
      }
      variablesGroup.appendChild(variableContent);
    });
  }
  attachEventListeners() {
    console.log("SolverVariablesPage: Attaching event listeners");
    // 1. as soon as variable option is chosen in radio, update state object data.radioGroupReference.current and data.radioGroupReference.isChosen to true, and save it to global app object (so that it can be used in solver home page when user goes back)
    //2. event listener for back button (go back to solver home page using router, while preserving its previous state(calling updateVDOM with previous state data. make a method inside component so that it would expose random updateVDOM))
    //3. event listener for solve button (call api, and again save everythn)

    //1. event listener for variable options
    const variableInputs = this.root.querySelectorAll(".variable-input");
    variableInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        const selectedVariable = event.target.value;
        console.log(
          `SolverVariablesPage: Variable option selected: ${selectedVariable}`,
        );
        this.setChosenVariable(selectedVariable);
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
        this.updateScreenContext();
        Router.go("/solver");
      });
    }

    //3. event listener for solve button
    const solveButton = this.root.querySelector("#btn-solve");
    if (solveButton) {
      //step1: if no variable chosen, show error message popup
      //step2: if variable is chosen, call api and save the data from api to screenContext, go by router to the next page(choosing solutions)
      solveButton.addEventListener("click", async (event) => {
        console.log("SolverVariablesPage: Solve button clicked");
        event.preventDefault();
        //call api to solve the equation with the selected variable and formula

        const { currentFormula } = this.data;
        const { current: target, isChosen } = this.data.radioGroupReference; //destructure from data
        console.log(
          `SolverVariablesPage: Current selection - variable: "${target}", formula: "${currentFormula}", isChosen: ${isChosen}`,
        );

        if (!isChosen) {
          console.warn(
            "SolverVariablesPage: No variable selected, showing error popup",
          );

          this.MyPopupService.showErrorPopup(
            "Please select a variable to solve for before proceeding.",
          ); //returns error popup text
          return;
        } else {
          console.log(
            "SolverVariablesPage: Variable selected, proceeding to call API",
          );
          const responseData = await API.solveForTarget(target);
          if (responseData.ok) {
            console.log(
              "SolverVariablesPage: API call successful, response data:",
              responseData,
            );
          } else {
            console.error(
              "SolverVariablesPage: API call failed, response data:",
              responseData,
            );
            this.MyPopupService.showErrorPopup(
              "An error occurred while solving the equation. Please try again.",
            );
            return;
          }
          const jsonDataSolverVariablesPage = responseData.data;
          if (jsonDataSolverVariablesPage) {
            console.log(
              "SolverVariablesPage: API response data for solver variables page:",
              jsonDataSolverVariablesPage,
            );
            this.jsonDataSolverVariablesPage = jsonDataSolverVariablesPage;
            const {
              status_bool,
              solutions,
              error,
              needs_choice,
              target,
              available,
              required_list_str,
              formula_string,
              is_const,
              is_one_var,
              is_multi_var,
              equation_type,
            } = jsonDataSolverVariablesPage;
          }
          if (!status_bool) {
            console.warn(
              `SolverVariablesPage: API response indicates failure, showing error ${error} popup`,
            );
            this.MyPopupService.showErrorPopup(
              `Failed to solve for variable "${target}". Server responded with an error "${error}". Please check your formula and try again.`,
            );
            this.updateScreenContext();
            return;
          } else {
            console.log(
              "SolverVariablesPage: API response indicates success, updating screen context and navigating to next page",
            );
            this.updateScreenContext();
            if (needs_choice) {
              console.log(
                `SolverVariablesPage: API response indicates multiple solutions, type ${equation_type}, navigating to solutions page`,
              );
              Router.go("/solver/solutions");
            } else {
              console.log(
                `SolverVariablesPage: API response indicates single solution or no solution, navigating to sweeper page`,
              );

              if (is_const) {
                Router.go("/solver/perform_sweep");
                console.log(
                  "SolverVariablesPage: API response indicates constant equation, navigating to perform sweep page",
                );
              } else if (is_one_var || is_multi_var) {
                Router.go("/solver/sweeper");
                console.log(
                  "SolverVariablesPage: API response indicates one or multiple variable equation with single solution, navigating to sweeper page",
                );
              } else {
                console.warn(
                  `SolverVariablesPage: API response indicates unexpected case (not const, not one var, not multi var) ${error}`,
                );
                this.MyPopupService.showErrorPopup(
                  `Unexpected response from server. Unable to determine next steps. Please try again or contact support. Error: ${error}`,
                );
                return;
              }
            }
          }
        }
      });
    }
  }
}

customElements.define("solver-variables-page", SolverVariablesPage);
