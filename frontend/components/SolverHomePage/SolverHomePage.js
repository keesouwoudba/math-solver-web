import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";
import UiPopup from "../UiPopup/UiPopup.js";
import Utilities from "./Utilities.js";
import Handlers from "./Handlers.js";

// TODO: Guard against duplicate shadow-root content if this component reconnects or re-renders.
export class SolverHomePage extends HTMLElement {
  app = window.app || {};

  //services
  screenContextService = ScreenContextService.getInstance(); //object starts with lowercase
  MyVDOMService;
  MyPopupService;
  eventAbortController;

  //data
  data;
  jsonDataSolverHomePage;

  //dom and state references
  prevDOM;
  vDOM;
  elems;
  inputStateRef = {
    current: "",
    selectionStart: 0,
    selectionEnd: 0,
    isFocused: false,
  };
  dynamicVDOM = [
    {
      tag: "div",
      className: "workspace-card",
      id: "",
      children: [
        { tag: "label", className: "formula-input", value: "Workspace" },
        {
          tag: "textarea",
          className: "textfield",
          placeholder: "Enter Formula",
          id: "formula-input",
          stateRef: this.inputStateRef,
        },
      ],
    },
    {
      tag: "div",
      className: "keypad",
      children: [
        {
          tag: "div",
          className: "btn-switcher-container",
          id: "btn-switcher-container",
          children: [
            {
              tag: "button",
              className: "btn-switcher active",
              id: "btn-algebraic",
              datatarget: "keypad-algebraic",
              value: "Algebra",
            },
            {
              tag: "button",
              className: "btn-switcher",
              id: "btn-trig",
              datatarget: "keypad-trig",
              value: "Trig",
            },
          ],
        },
        {
          tag: "div",
          className: "keypad-grid active",
          id: "keypad-algebraic",
          children: [
            {
              tag: "button",
              className: "button-white",
              id: "operator-equals",
              type: "operator",
              value: "=",
            },
            {
              tag: "button",
              className: "button-white",
              id: "operator-add",
              type: "operator",
              value: "+",
            },
            {
              tag: "button",
              className: "button-white",
              id: "operator-subtract",
              type: "operator",
              value: "-",
            },
            {
              tag: "button",
              className: "button-white",
              id: "operator-multiply",
              type: "operator",
              value: "*",
            },
            {
              tag: "button",
              className: "button-white",
              id: "operator-divide",
              type: "operator",
              value: "/",
            },
            {
              tag: "button",
              className: "button-white",
              id: "operator-pow",
              type: "operator",
              value: "()**()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-sqrt",
              type: "function",
              value: "sqrt()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-log",
              type: "function",
              value: "log()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-ln",
              type: "function",
              value: "ln()",
            },
          ],
        },
        {
          tag: "div",
          className: "keypad-grid",
          id: "keypad-trig",
          children: [
            {
              tag: "button",
              className: "button-white",
              id: "function-sin",
              type: "function",
              value: "sin()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-cos",
              type: "function",
              value: "cos()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-tan",
              type: "function",
              value: "tan()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-cot",
              type: "function",
              value: "cot()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-csc",
              type: "function",
              value: "csc()",
            },
            {
              tag: "button",
              className: "button-white",
              id: "function-sec",
              type: "function",
              value: "sec()",
            },
          ],
        },
        {
          tag: "div",
          className: "helper-btns-container",
          id: "helper-btns-container",
          children: [
            {
              tag: "button",
              className: "btn-clear",
              id: "btn-clear",
              value: "Clear 🗑️",
            },
            {
              tag: "button",
              className: "btn-backspace",
              id: "btn-backspace",
              value: "⌫",
            },
            {
              tag: "button",
              className: "btn-solve",
              id: "btn-solve",
              value: "Solve ✅",
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
    console.log("SolverHomePage: connectedCallback called");
    this.MyVDOMService.updateDOM();
    this.attachEventListeners();
  }
  disconnectedCallback() {
    console.log(
      "SolverHomePage: disconnectedCallback called, updating screen context",
    );
    this.updateScreenContext();
    if (this.eventAbortController) {
      this.eventAbortController.abort();
      this.eventAbortController = null;
    }
  }

  //impure instance utilities
  loadCSS() {
    console.log(`SolverHomePage: Loading CSS for SolverHomePage`);
    const styles = document.createElement("style");
    styles.textContent = `@import "/frontend/components/SolverHomePage/SolverHomePage.css";`;
    this.root.appendChild(styles);
    console.log(`SolverHomePage: CSS loaded for SolverHomePage`);
  }
  activateData() {
    if (!this.data && !ScreenContextService.getInstance().SolverHomePageData) {
      this.vDOM = VDOMService.createVDOM(this.dynamicVDOM);
      this.data = {
        vDOM: this.vDOM,
        prevDOM: this.prevDOM,
        elems: this.elems,
        inputStateRef: this.inputStateRef,
        dynamicVDOM: this.dynamicVDOM,
        onlySusceptible: true,
        susceptibleIndexes: [0],
        popupState: {
          isVisible: false,
          message: "",
        },
        jsonDataSolverHomePage: this.jsonDataSolverHomePage,
        MyVDOMService: this.MyVDOMService,
        MyPopupService: this.MyPopupService,
      };
      this.MyVDOMService = new VDOMService(this.root, this.data);
      this.MyPopupService = new PopupService(this.root, this.data);
      this.screenContextService.setSolverHomePageContext(
        this.data,
        this.jsonDataSolverHomePage,
      );
      console.log(`SolverHomePage: VDOM activated and services initialized`);
    } else {
      //recreate state from screen context service
      this.recreateStateFromScreenContext();
    }
  }
  updateScreenContext() {
    this.screenContextService.setSolverHomePageContext(
      this.data,
      this.jsonDataSolverHomePage,
    );
    console.log(
      `SolverHomePage: Screen context updated with current data and JSON`,
    );
  }
  recreateStateFromScreenContext() {
    const solverHomePageContext =
      this.screenContextService.getSolverHomePageContext() || {};
    //destructure data and json from context
    ({ data: this.data, jsonDataSolverHomePage: this.jsonDataSolverHomePage } =
      solverHomePageContext);

    const solverHomePageData = solverHomePageContext.data || {};
    ({
      inputStateRef: this.inputStateRef,
      vDOM: this.vDOM,
      prevDOM: this.prevDOM,
    } = solverHomePageData);

    this.elems = undefined; //to be recreated by VDOMService
    this.data.elems = this.elems; //just in case

    this.MyVDOMService = new VDOMService(this.root, this.data);
    this.MyPopupService = new PopupService(this.root, this.data);

    this.data.MyVDOMService = this.MyVDOMService; //to make sure data has the reference to the new instance of VDOMService
    this.data.MyPopupService = this.MyPopupService; //to make sure data has the reference to the new instance of PopupService

    console.log(
      `SolverHomePage: State recreated from screen context with data and JSON`,
    );
  }

  setCurrentInput(current) {
    if (current !== "UNCHANGED") {
      this.inputStateRef.current = current;
      console.log(`SolverHomePage: Current input set to "${current}"`);
    } else {
      console.log(`SolverHomePage: Current input unchanged`);
    }
  }

  setSelectionRange(start, end) {
    this.inputStateRef.selectionStart = start;
    this.inputStateRef.selectionEnd = end;
    console.log(
      `SolverHomePage: Selection range updated to start=${start}, end=${end}`,
    );
  }

  setFocusState(isFocused) {
    this.inputStateRef.isFocused = isFocused;
    console.log(`SolverHomePage: Focus state updated to ${isFocused}`);
  }

  applyInputState({ current, selectionStart, selectionEnd, isFocused = true }) {
    if (current !== "UNCHANGED") {
      this.setCurrentInput(current);
    } else {
      console.log(`SolverHomePage: Current input unchanged`);
    }
    this.setSelectionRange(selectionStart, selectionEnd);
    this.setFocusState(isFocused);
    console.log(
      `SolverHomePage: Input state applied with current="${current}", selectionStart=${selectionStart}, selectionEnd=${selectionEnd}, isFocused=${isFocused}`,
    );
  }

  //all of them
  attachEventListeners() {
    if (this.eventAbortController) {
      this.eventAbortController.abort();
    }
    this.eventAbortController = new AbortController();
    const { signal } = this.eventAbortController;

    // Add event listeners for tab switching
    const buttons = this.root.querySelectorAll(".btn-switcher");
    const panels = this.root.querySelectorAll(".keypad-grid");
    buttons.forEach((btn) => {
      btn.addEventListener(
        "click",
        (event) => {
          const targetPanel = this.root.querySelector(`#${btn.dataset.target}`);
          Handlers.tabSwitchHandler(buttons, panels, btn, targetPanel);
        },
        { signal },
      );
    });

    //add event listeners for textarea input focusin and focusout to track focus state
    const textarea = this.root.querySelector("#formula-input");
    if (textarea) {
      this.root.addEventListener(
        "focusin",
        (event) => {
          this.setFocusState(
            Handlers.focusinHandler(event) || this.inputStateRef.isFocused,
          );
        },
        { signal },
      );
      this.root.addEventListener(
        "focusout",
        (event) => {
          this.setFocusState(
            Handlers.focusoutHandler(event)
              ? false
              : this.inputStateRef.isFocused,
          );
        },
        { signal },
      );
      //add event listeners for textarea input to track selection and caret position changes
      const syncCaretFromTextarea = () => {
        if (!textarea) return;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? start;
        this.setSelectionRange(start, end);
        this.setFocusState(textarea.matches(":focus"));
      };
      textarea.addEventListener("keyup", syncCaretFromTextarea, { signal });
      textarea.addEventListener("mouseup", syncCaretFromTextarea, { signal });
      textarea.addEventListener("select", syncCaretFromTextarea, { signal });
    }

    // delegated input handler survives DOM node replacement after patching, but anyway i want to edit it not to replace full element, but just value
    this.root.addEventListener(
      "input",
      (event) => {
        const result = Handlers.inputChangeHandler(event);
        if (!result) return;
        this.MyVDOMService.takeSnapshot();
        //mutate the data
        this.applyInputState(result);
        console.log(
          `SolverHomePage: User input updated to "${this.inputStateRef.current}"`,
        );
        this.MyVDOMService.updateDOM("from user input change");
        this.updateScreenContext();
      },
      { signal },
    );

    //add event listener for clear button
    const clearBtn = this.root.querySelector("#btn-clear");
    if (clearBtn) {
      clearBtn.addEventListener(
        "click",
        () => {
          this.MyVDOMService.takeSnapshot();

          //clear input and save cursor position
          this.applyInputState({
            current: "",
            selectionStart: 0,
            selectionEnd: 0,
            isFocused: false,
          });

          console.log(
            `SolverHomePage: Clear button clicked, user input cleared`,
          );
          this.MyVDOMService.updateDOM("from clear button click");
          this.updateScreenContext();
        },
        { signal },
      );
    }

    //add event listener for backspace button
    const backspaceBtn = this.root.querySelector("#btn-backspace");
    if (backspaceBtn) {
      backspaceBtn.addEventListener(
        "click",
        () => {
          this.MyVDOMService.takeSnapshot();

          const liveValue = textarea?.value ?? this.inputStateRef.current ?? "";
          const liveStart =
            textarea?.selectionStart ??
            this.inputStateRef.selectionStart ??
            liveValue.length;
          const liveEnd =
            textarea?.selectionEnd ??
            this.inputStateRef.selectionEnd ??
            liveStart;
          const s = Math.min(liveStart, liveEnd);
          const e = Math.max(liveStart, liveEnd);

          const result = Handlers.backspaceButtonHandler(liveValue, s, e);
          this.applyInputState(result);

          console.log(
            `SolverHomePage: Backspace button clicked, user input updated to "${this.inputStateRef.current}"`,
          );
          this.MyVDOMService.updateDOM("from backspace button click");
          this.updateScreenContext();
        },
        { signal },
      );
    }

    //add event listeners for operator and function buttons
    const operatorAndFunctionButtons =
      this.root.querySelectorAll(".button-white");
    operatorAndFunctionButtons.forEach((btn) => {
      btn.addEventListener(
        "click",
        (event) => {
          this.MyVDOMService.takeSnapshot();
          const textarea = this.root.querySelector("#formula-input"); //pass textarea as arg

          const result = Utilities.saveCaretPositions(event, textarea);
          if (!result.status) {
            return;
          }
          const { valueToInsert, id } = result;
          this.applyInputState(result);

          if (id.startsWith("operator-")) {
            //operator handler function: receives: this.data.inputStateRef returns: {status, current, selectionStart, selectionEnd, isFocused=true}
            //move cursor to the end of inserted operator for default
            const result = Handlers.operatorButtonHandler(
              this.data.inputStateRef,
              valueToInsert,
              id,
            );
            this.applyInputState(result);
          } else if (id.startsWith("function-")) {
            //check with regex if * is needed to insert
            const result = Handlers.functionButtonHandler(
              this.data.inputStateRef,
              valueToInsert,
              id,
            );
            this.applyInputState(result);
          }
          this.MyVDOMService.updateDOM(
            `from operator/function button click, id: ${id}`,
          );
          this.updateScreenContext();
        },
        { signal },
      );
    });

    //add event listener for solve button
    const solveBtn = this.root.querySelector("#btn-solve");
    if (solveBtn) {
      solveBtn.addEventListener(
        "click",
        async () => {
          //step1: validate user current input. (TODO: create a new helper validateSyntax like my python code in comments)
          //step2: call api to set the formula
          //step3: if validation is bad, show popup with the error mesage and real problem user had in syntax

          //step1:
          const [isValid, message] = Utilities.validateSyntax(
            this.data.inputStateRef.current,
          );

          //step2:
          if (isValid) {
            const responseData = await API.setFormula({
              formula_string: this.data.inputStateRef.current,
            });
            if (responseData.ok) {
              console.log(`SolverHomePage: set formula response ok`);
            } else {
              console.error(
                `SolverHomePage: set formula API call failed with status ${responseData.status}`,
              );
              this.MyPopupService.showErrorPopup(
                `Failed to set formula. Server responded with status ${responseData.status}. Please try again.`,
              );
              return;
            }
            const jsonDataSolverHomePage = responseData.data;
            if (jsonDataSolverHomePage) {
              console.log(`SolverHomePage: Server response indicates success`);
              // we are supposed to take the variables from the equation and move to the next page (for choosing the varibales)
              this.jsonDataSolverHomePage = jsonDataSolverHomePage; //before this is was replacing all manual assignemnts with faca
              this.updateScreenContext();
              const { variables, status_bool, valid, error, formula_string } =
                jsonDataSolverHomePage;

              if (status_bool && valid) {
                this.data.popupState.message =
                  message ||
                  "formula is valid, moving to variable selection page";
                this.updateScreenContext();
                Router.go("/solver/variables");
              } else {
                //step 3
                this.data.popupState.message = error || "unknown error";
                this.updateScreenContext();
                this.MyPopupService.showErrorPopup(
                  `Validation failed: ${error || "unknown error"}, formula string: ${formula_string || "not provided"}, variables parsed: ${variables ? variables.join(", ") : "not provided"}`,
                );
              }
            }
          } else {
            //step 3
            this.data.popupState.message =
              message || "unknown validation error";
            this.updateScreenContext();
            this.MyPopupService.showErrorPopup(
              `Validation failed: ${this.data.popupState.message}`,
            );
          }
        },
        { signal },
      );
    }
  }
}

customElements.define("solver-home-page", SolverHomePage);
