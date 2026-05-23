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
  prevDOM;
  vDOM;
  elems;

  dynamicVDOM = [
    {
      tag: "div",
      className: "breadcrumb",
      id: "breadcrumb",
      children: [
        {
          tag: "a",
          className: "breadcrumb-item",
          id: "breadcrumb-home",
          href: "/",
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
            {
              tag: "button",
              className: "copy-button",
              id: "copy-button",
              title: "Copy",
              textContent: "📋",
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
    this.MyVDOMService.updateDOM();
    this.setEquations();
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
        prevDOM: this.prevDOM,
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
    ({
      data: this.data,
      jsonDataSolverEquationResultsPage: this.jsonDataSolverEquationResultsPage,
    } = solverEquationResultsPageContext);

    const solverEquationResultsPageData =
      solverEquationResultsPageContext.data || {};
    ({ vDOM: this.vDOM, prevDOM: this.prevDOM } =
      solverEquationResultsPageData);

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
    this.MyVDOMService.updateDOM("setEquations");
  }

  setOriginalFormulation(equation) {
    const originalEquationNode = this.data.vDOM[1].children[1].children[0];
    originalEquationNode.textContent = equation;
    console.log(
      `SolverEquationResultsPage: Original formulation set in VDOM: ${equation}`,
    );
  }

  setSolutions(solutions) {
    const solutionsGridNode = this.data.vDOM[2].children[1];
    //clear previous solutions
    solutionsGridNode.children = [];
    //add new solutions
    solutions.forEach((solution, index) => {
      solutionsGridNode.children.push({
        tag: "div",
        className: "solution-item",
        id: `solution-${index}`,
        textContent: solution,
      });
    });
    console.log(
      `SolverEquationResultsPage: Solutions set in VDOM: ${solutions.join(", ")}`,
    );
  }

  //event listeners, to be implemented as needed
  attachEventListeners() {}
}
