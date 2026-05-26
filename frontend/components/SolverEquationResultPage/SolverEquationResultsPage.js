import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";

export class SolverEquationResultsPage extends HTMLElement {
  app = window.app || {};

  //services
  screenContextService = ScreenContextService.getInstance();
  MyVDOMService;
  MyPopupService;

  //data
  data;
  //previous page
  jsonDataSolverVariablesPage;

  //dom and state references
  prevVDOM;
  vDOM;
  elems;

  dynamicVDOM = [
    {
      tag: "div",
      className: "breadcrumb",
      id: "breadcrumb",
      children: [
        {
          tag: "button",
          className: "breadcrumb-item",
          id: "breadcrumb-home",
          children: [
            {
              tag: "span",
              className: "breadcrumb-text",
              id: "breadcrumb-home-text",
              textContent: "🏠 Home",
            },
          ],
        },
        {
          tag: "h1",
          className: "breadcrumb-title",
          id: "breadcrumb-title",
          textContent: "Calculation Results",
        },
      ],
    },
    {
      tag: "div",
      className: "original-container",
      id: "original-container",
      children: [
        {
          tag: "span",
          className: "original-equation-title",
          id: "original-equation-title",
          textContent: "Original Equation",
        },
        {
          tag: "div",
          className: "original-equation-container",
          id: "original-equation-container",
          children: [
            {
              tag: "span",
              className: "original-equation",
              id: "original-equation",
              textContent: "", //to be filled with the original equation from JSON
            },
          ],
        },
      ],
    },
    {
      tag: "div",
      className: "solutions-container",
      id: "solutions-container",
      children: [
        {
          tag: "span",
          className: "solutions-title",
          id: "solutions-title",
          textContent: "Solutions",
        },
        {
          tag: "div",
          className: "solutions-grid",
          id: "solutions-grid",
          children: [
            //to be filled with solutions from JSON example:  {tag: "div", className: "solution-item", id: "solution-{index}", textContent: ""}
          ],
        },
      ],
    },
    {
      tag: "div",
      className: "actions-container",
      id: "actions-container",
      children: [
        {
          tag: "div",
          className: "sweeper-promo-container",
          id: "sweeper-promo-container",
          children: [
            {
              tag: "div",
              className: "sweeper-promo-text-container",
              id: "sweeper-promo-text-container",
              children: [
                {
                  tag: "div",
                  className: "sweeper-promo-text",
                  id: "sweeper-promo-text",
                  textContent: "📈 Analyze Further",
                },
                {
                  tag: "p",
                  className: "sweeper-promo-description",
                  id: "sweeper-promo-description",
                  textContent:
                    "Want to analyze further? Sweep this equation across a range of variables to generate a data table or plot.",
                },
              ],
            },
            {
              tag: "button",
              className: "sweeper-promo-button",
              id: "sweeper-promo-button",
              textContent: "🧹 Sweep/Plot This Equation",
            },
          ],
        },
      ],
    },
    {
      tag: "div",
      className: "secondary-actions-container",
      id: "secondary-actions-container",
      children: [
        {
          tag: "button",
          className: "new-calculation-button",
          id: "new-calculation-button",
          textContent: "➕ New Calculation",
        },
        {
          tag: "button",
          className: "save-calculation-button",
          id: "save-calculation-button",
          textContent: "💾 Save Calculation",
        },
        {
          tag: "button",
          className: "back-button",
          id: "back-button",
          textContent: "🔙 Back to Editor",
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
    console.log("SolverEquationResultsPage: connectedCallback called");
    this.MyVDOMService.updateDOM("connectedCallback initial render");
    this.MyVDOMService.takeSnapshot(); //take snapshot before patches
    this.setEquations(); //set the original equation and solution to currentVdom
    this.updateScreenContext();
    this.MyVDOMService.updateDOM("connectedCallback render after adding data");
    this.attachEventListeners();
  }
  disconnectedCallback() {
    console.log(
      "SolverEquationResultsPage: disconnectedCallback called, updating screen context",
    );
    this.updateScreenContext();
  }

  loadCSS() {
    console.log(
      `SolverEquationResultsPage: Loading CSS for SolverEquationResultsPage`,
    );
    const styles = document.createElement("style");
    styles.textContent = `@import "/frontend/components/SolverEquationResultPage/SolverEquationResultsPage.css";`;
    this.root.appendChild(styles);
    console.log(
      `SolverEquationResultsPage: CSS loaded for SolverEquationResultsPage`,
    );
  }

  activateData() {
    if (
      !this.data &&
      !ScreenContextService.getInstance().SolverEquationResultsPageData
    ) {
      this.vDOM = VDOMService.createVDOM(this.dynamicVDOM);
      this.data = {
        vDOM: this.vDOM,
        prevVDOM: this.prevVDOM,
        elems: this.elems,
        dynamicVDOM: this.dynamicVDOM,
        onlySusceptible: true,
        susceptibleIndexes: [1, 2], //we will put here the index of the branch where we wave solutions grid
        popupState: {
          isVisible: false,
          message: "",
        },
        solutions: [],
        jsonDataSolverEquationResultsPage:
          this.jsonDataSolverEquationResultsPage,
        MyVDOMService: this.MyVDOMService,
        MyPopupService: this.MyPopupService,
      };
      this.jsonDataSolverVariablesPage =
        this.screenContextService.getSolverVariablesPageContext()?.json;
      this.MyVDOMService = new VDOMService(this.root, this.data);
      this.MyPopupService = new PopupService(this.root, this.data);
      this.screenContextService.setSolverEquationResultsPageContext(
        this.data,
        this.jsonDataSolverEquationResultsPage,
      );
      console.log(
        `SolverEquationResultsPage: VDOM activated and services initialized`,
      );
    } else {
      //recreate state from screen context service
      this.recreateStateFromScreenContext();
    }
  }
  updateScreenContext() {
    this.screenContextService.setSolverEquationResultsPageContext(
      this.data,
      this.jsonDataSolverEquationResultsPage,
    );
    console.log(
      `SolverEquationResultsPage: Screen context updated with current data and JSON`,
    );
  }
  recreateStateFromScreenContext() {
    const solverEquationResultsPageContext =
      this.screenContextService.getSolverEquationResultsPageContext() || {};
    //destructure data and json from context
    ({ data: this.data, json: this.jsonDataSolverEquationResultsPage } =
      solverEquationResultsPageContext); //should have been just json

    const solverEquationResultsPageData =
      solverEquationResultsPageContext.data || {};
    ({ vDOM: this.vDOM, prevVDOM: this.prevVDOM } =
      solverEquationResultsPageData);

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
      `SolverEquationResultsPage: State recreated from screen context with data and JSON`,
    );
  }
  setEquations() {
    const originalEquation =
      this.jsonDataSolverVariablesPage?.formula_string || "";
    this.setOriginalFormulation(originalEquation);
    const solutions = this.jsonDataSolverVariablesPage?.solutions || [];
    this.setSolutions(solutions);
  }

  setOriginalFormulation(equation) {
    const originalEquationNode = this.data.vDOM[1].children[1].children[0];
    originalEquationNode.textContent = equation;
    //append copy button with the value for container
    this.data.vDOM[1].children[1].children[1] = {
      tag: "button",
      className: "copy-button",
      id: "copy-original-equation-button",
      title: "Copy",
      value: equation,
      textContent: "📋",
    };
    console.log(
      `SolverEquationResultsPage: Original formulation set in VDOM: ${equation}`,
    );
  }

  setSolutions(solutions) {
    const solutionsGridNode = this.data.vDOM[2].children[1];
    //clear previous solutions
    solutionsGridNode.children = [];
    const target = this.jsonDataSolverVariablesPage?.target || "Solution";
    //add new solutions
    solutions.forEach((solution, index) => {
      const solutionText = `${target}${solutions.length > 1 ? index + 1 : ""} = ${solution}`;
      solutionsGridNode.children.push({
        tag: "div",
        className: "solution-item",
        id: `solution-${index}`,
        children: [
          {
            tag: "span",
            className: "solution-text",
            id: `solution-text-${index}`,
            textContent: solutionText,
          },
          {
            tag: "button",
            className: "copy-button",
            id: `copy-solution-button-${index}`,
            title: "Copy",
            textContent: "📋",
            value: solutionText,
          },
        ],
      });
    });
    console.log(
      `SolverEquationResultsPage: Solutions set in VDOM: ${solutions.join(", ")}`,
    );
  }

  //event listeners, to be implemented as needed
  attachEventListeners() {
    //plan:
    //1. event listener for home btn in breadcrumb
    //2. event listener for all copy equation btns
    //3. event listener for sweep/plot button
    //4. event listener for new calculation button
    //5. event listener for save calculation button
    //6. event listener for back to editor button

    //1. event listener for home btn in breadcrumb
    const breadcrumbHomeBtn = this.root.querySelector("#breadcrumb-home");
    if (breadcrumbHomeBtn) {
      breadcrumbHomeBtn.addEventListener("click", () => {
        this.updateScreenContext();
        Router.go("/");
      });
    }

    //2. event listener for all copy equation btns
    this.root.addEventListener("click", (event) => {
      if (event.target.classList.contains("copy-button")) {
        const valueToCopy = event.target.value;
        navigator.clipboard
          .writeText(valueToCopy)
          .then(() => {
            this.MyPopupService.showDefaultPopup("Copied to clipboard!");
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
            this.MyPopupService.showErrorPopup("Failed to copy");
          });
      }
    });

    //3. event listener for sweep/plot button
    const sweeperPromoButton = this.root.querySelector("#sweeper-promo-button");
    if (sweeperPromoButton) {
      sweeperPromoButton.addEventListener("click", () => {
        this.updateScreenContext();
        const { status_bool, error, needs_choice } =
          this.jsonDataSolverVariablesPage || {};

        if (!status_bool) {
          console.warn(
            `Cannot sweep/plot this equation. ${error || "Unknown error."}`,
          );
          this.MyPopupService.showErrorPopup(
            `Cannot sweep/plot this equation. ${error || "Unknown error."}`,
          );
          return;
        } else {
          console.log(
            "SolverEquationResultsPage: data exists, deciding the choice based on equation type ",
          );
          this.updateScreenContext();
          if (needs_choice) {
            console.log(
              "SolverEquationResultsPage: needs user choice, navigating to SolverSolutionsChoicePage",
            );
            Router.go("/solver/solutions_choice");
            return;
          } else {
            console.log(
              "SolverEquationResultsPage: no user choice needed, navigating SolverSweeperConfigurationPage",
            );
            Router.go("/solver/sweeper_configuration");
            return;
          }
          this.MyPopupService.showErrorPopup(
            `Sweeping/Plotting not available for this equation type: ${equation_type}`,
          );
        }
      });
    }

    //4. event listener for new calculation button
    const newCalculationButton = this.root.querySelector(
      "#new-calculation-button",
    );
    if (newCalculationButton) {
      newCalculationButton.addEventListener("click", () => {
        this.screenContextService.resetScreenContext(); //reset all screen contexts to clear data
        Router.go("/solver");
      });
    }

    //5. event listener for save calculation button
    //let me think about how can we save it. maybe some local browser storage apis, to store all the screencontexts as json
    //i will do it later. for now no need state
    const saveBtn = this.root.querySelector("#save-calculation-button");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        this.MyPopupService.showDefaultPopup("Save functionality coming soon!");
      });
    }

    //6. event listener for back to editor button
    const backButton = this.root.querySelector("#back-button");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.updateScreenContext();
        Router.go("/solver");
      });
    }
  }
}

customElements.define(
  "solver-equation-results-page",
  SolverEquationResultsPage,
);
