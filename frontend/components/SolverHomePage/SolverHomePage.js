import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";
import UiPopup from "../UiPopup/UiPopup.js";

export class SolverHomePage extends HTMLElement {
  MyVDOMService;
  MyPopupService;
  prevDOM;
  elems;
  data;
  vDOM;
  jsonDataSolverHomePage;
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
    const styles = document.createElement("style");
    this.root.appendChild(styles);
    const loadCSS = () => {
      console.log(`SolverHomePage: Loading CSS for SolverHomePage`);
      styles.textContent = `@import "/frontend/components/SolverHomePage/SolverHomePage.css";`;
      console.log(`SolverHomePage: CSS loaded for SolverHomePage`);
    };
    const activateVDOM = () => {
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
      };
      this.MyVDOMService = new VDOMService(this.root, this.data);
      this.MyPopupService = new PopupService(this.root, this.data);
      window.app.SolverHomePageData = this.data;
    };

    loadCSS();
    activateVDOM();
  }

  //once element is on the page
  connectedCallback() {
    console.log("SolverHomePage: connectedCallback called");
    this.MyVDOMService.updateDOM();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Add event listeners for tab switching
    const buttons = this.root.querySelectorAll(".btn-switcher");
    const panels = this.root.querySelectorAll(".keypad-grid");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // remove active from all buttons and panels
        buttons.forEach((b) => b.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));

        // activate clicked button and its matching panel
        btn.classList.add("active");
        const targetPanel = this.root.querySelector(`#${btn.dataset.target}`);
        if (!targetPanel) {
          return;
        }
        targetPanel.classList.add("active");
      });
    });

    //add event listeners for textarea input focusin and focusout to track focus state
    const textarea = this.root.querySelector("#formula-input");
    if (textarea) {
      this.root.addEventListener("focusin", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
          return;
        }
        if (target.id !== "formula-input") {
          return;
        }
        this.inputStateRef.isFocused = true;
        console.log(`SolverHomePage: Textarea focused`);
      });
      this.root.addEventListener("focusout", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
          return;
        }
        if (target.id !== "formula-input") {
          return;
        }
        this.inputStateRef.isFocused = false;
        console.log(`SolverHomePage: Textarea focusout`);
      });
    }

    // delegated input handler survives DOM node replacement after patching, but anyway i want to edit it not to replace full element, but just value
    this.root.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) {
        return;
      }
      if (target.id !== "formula-input") {
        return;
      }

      this.MyVDOMService.takeSnapshot(); //i could have done a proxy that automatically takes snapshot before value change, but this is fine for now, i will refactor later ;)
      this.inputStateRef.current = target.value;
      this.inputStateRef.selectionStart = target.selectionStart;
      this.inputStateRef.selectionEnd = target.selectionEnd;
      this.inputStateRef.isFocused = target.matches(":focus");

      console.log(
        `SolverHomePage: User input updated to "${this.inputStateRef.current}"`,
      );
      this.MyVDOMService.updateDOM("from user input change");
    });

    //add event listener for clear button
    const clearBtn = this.root.querySelector("#btn-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.MyVDOMService.takeSnapshot();

        //clear input and save cursor position
        this.inputStateRef.current = "";
        this.inputStateRef.selectionStart = 0;
        this.inputStateRef.selectionEnd = 0;
        this.inputStateRef.isFocused = false;

        console.log(`SolverHomePage: Clear button clicked, user input cleared`);
        this.MyVDOMService.updateDOM("from clear button click");
      });
    }

    //add event listener for backspace button
    const backspaceBtn = this.root.querySelector("#btn-backspace");
    if (backspaceBtn) {
      backspaceBtn.addEventListener("click", () => {
        this.MyVDOMService.takeSnapshot();

        const value = this.inputStateRef.current ?? "";
        const start = this.inputStateRef.selectionStart ?? value.length;
        const end = this.inputStateRef.selectionEnd ?? start;
        const s = Math.min(start, end);
        const e = Math.max(start, end);

        let nextValue = value;
        let nextPos = s;
        if (s !== e) {
          nextValue = value.slice(0, s) + value.slice(e);
          nextPos = s;
        } else if (s > 0) {
          nextValue = value.slice(0, s - 1) + value.slice(e);
          nextPos = s - 1;
        }

        this.inputStateRef.current = nextValue;
        this.inputStateRef.selectionStart = nextPos;
        this.inputStateRef.selectionEnd = nextPos;
        this.inputStateRef.isFocused = true;

        console.log(
          `SolverHomePage: Backspace button clicked, user input updated to "${this.inputStateRef.current}"`,
        );
        this.MyVDOMService.updateDOM("from backspace button click");
      });
    }

    //add event listeners for operator and function buttons
    const operatorAndFunctionButtons =
      this.root.querySelectorAll(".button-white");
    operatorAndFunctionButtons.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
          return;
        }
        const valueToInsert = target.value;
        if (!valueToInsert) {
          return;
        }
        const id = target.id;
        if (!id) {
          return;
        }
        this.MyVDOMService.takeSnapshot();

        // save cursor position first
        const textarea = this.root.querySelector("#formula-input");
        if (textarea) {
          const start = textarea.selectionStart ?? 0;
          const end = textarea.selectionEnd ?? start;
          const dir = textarea.selectionDirection;
          const caret = dir === "backward" ? start : end;
          this.inputStateRef.selectionStart = caret;
          this.inputStateRef.selectionEnd = caret;
          this.inputStateRef.isFocused = true;
        }
        //i will hardcode the logic and add such logic that it will validate by regex, insert whatever's needed , for example for pow it will insert ()**() and put cursor in the middle, for functions it will insert function() and put cursor in the middle of parentheses, for operators it will just insert operator at cursor position.

        //i stopped here: i need to think about regex which will take the last valid thing just before the crsor. and not something if there is one space
        if (id.startsWith("operator-")) {
          //move cursor to the end of inserted operator for default
          if (!valueToInsert.includes("()**()")) {
            //  +-*/ operators
            this.data.inputStateRef.current = `${this.data.inputStateRef.current.slice(0, this.data.inputStateRef.selectionStart)} ${valueToInsert} ${this.data.inputStateRef.current.slice(this.data.inputStateRef.selectionEnd)}`;
            this.data.inputStateRef.selectionStart += valueToInsert.length + 2;
            this.data.inputStateRef.selectionEnd =
              this.data.inputStateRef.selectionStart;
          } else {
            //for pow operator: identify if there is something already that can be raised onto power. check with regex. if there is something valid, then insert that thing into first parentheses, and put cursor in second parentheses, if there is nothing valid to raise to power, just insert ()**() and put cursor in the middle of first parentheses
            const beforeCursor = this.data.inputStateRef.current.slice(
              0,
              this.data.inputStateRef.selectionStart,
            ); //x + 1
            const regex = /([a-zA-Z0-9\)]+)$/; // better make a capturing group for the last valid thing to raise to the power
            const match = beforeCursor.match(regex);
            if (match) {
              const toWrap = match?.[match.length - 1] || "";
              const startIdx =
                this.data.inputStateRef.selectionStart - toWrap.length; //x*1 + {|6}vvv{|9} -> x*1 + ({|789}vvv)**({|14})
              this.data.inputStateRef.current = `${this.data.inputStateRef.current.slice(0, startIdx)}(${toWrap})**() ${this.data.inputStateRef.current.slice(this.data.inputStateRef.selectionStart)}`;
              this.data.inputStateRef.selectionStart = //x*1 + {|6 in v}vvv{|9} -> x*1 + ({|789}vvv)**({|14})
                startIdx + toWrap.length + 5; //to move cursor inside second parentheses
              this.data.inputStateRef.selectionEnd =
                this.data.inputStateRef.selectionStart;
            } else {
              //means there is nothing to wrap, just insert ()**() and put cursor in the middle of first parentheses
              this.data.inputStateRef.current = `${this.data.inputStateRef.current.slice(0, this.data.inputStateRef.selectionStart)} ()**() ${this.data.inputStateRef.current.slice(this.data.inputStateRef.selectionEnd)}`;
              this.data.inputStateRef.selectionStart += 2; //to move cursor in the middle of first parentheses
              this.data.inputStateRef.selectionEnd = //3 * x + 1
                this.data.inputStateRef.selectionStart;
            }
          }
        } else if (id.startsWith("function-")) {
          //check with regex if * is needed to insert
          const beforeCursor = this.data.inputStateRef.current.slice(
            0,
            this.data.inputStateRef.selectionStart,
          );
          const regex = /([a-zA-Z0-9\)]+)$/;
          const match = beforeCursor.match(regex);
          const lastMatch = match?.[match.length - 1] || "";
          if (match) {
            //there is smth before cursor that can be multiplied, so insert * before function
            this.data.inputStateRef.current = `${this.data.inputStateRef.current.slice(0, this.data.inputStateRef.selectionStart)} * ${valueToInsert}${this.data.inputStateRef.current.slice(this.data.inputStateRef.selectionEnd)}`;
            this.data.inputStateRef.selectionStart +=
              3 + valueToInsert.indexOf("()") + 1; //to move cursor in the middle of parentheses of function
            this.data.inputStateRef.selectionEnd =
              this.data.inputStateRef.selectionStart;
          } else {
            //there is nothing valid to multiply, just insert function() and put cursor in the middle of parentheses
            //insert function with parentheses and put cursor in the middle
            this.data.inputStateRef.current = `${this.data.inputStateRef.current.slice(0, this.data.inputStateRef.selectionStart)} ${valueToInsert}${this.data.inputStateRef.current.slice(this.data.inputStateRef.selectionEnd)}`;
            //move cursor to the middle of parentheses
            this.data.inputStateRef.selectionStart +=
              1 + valueToInsert.indexOf("()") + 1; // ff *-> ff * sin(|)
            this.data.inputStateRef.selectionEnd =
              this.data.inputStateRef.selectionStart;
          }
        }
        this.MyVDOMService.updateDOM(
          `from operator/function button click, id: ${id}`,
        );
      });
    });

    //add event listener for solve button
    const solveBtn = this.root.querySelector("#btn-solve");
    if (solveBtn) {
      solveBtn.addEventListener("click", async () => {
        //step1: validate user current input. (TODO: create a new helper validateSyntax like my python code in comments)
        //step2: call api to set the formula
        //step3: if validation is bad, show popup with the error mesage and real problem user had in syntax

        //step1:
        const isValid = this.validateSyntax(this.data.inputStateRef.current);

        //step2:
        if (isValid) {
          const responseData = await API.setFormula(
            this.data.inputStateRef.current,
          );
          if (responseData.ok) {
            console.log(`SolverHomePage: set formula response ok`);
          }
          const jsonDataSolverHomePage = responseData.data;
          if (jsonDataSolverHomePage) {
            console.log(`SolverHomePage: Server response indicates success`);
            // we are supposed to take the variables from the equation and move to the next page (for choosing the varibales)
            this.jsonDataSolverHomePage = jsonDataSolverHomePage;
            window.app.jsonDataSolverHomePage = jsonDataSolverHomePage;
            const { variables, status_bool, valid, error, formula_string } =
              jsonDataSolverHomePage;

            if (status_bool && valid) {
              Router.go("/solver/variables");
            } else {
              //step 3
              this.MyPopupService.showErrorPopup(
                `Validation failed: ${error || "unknown error"}, formula string: ${formula_string || "not provided"}, variables parsed: ${variables ? variables.join(", ") : "not provided"}`,
              );
            }
          }
        } else {
          //step 3
          this.MyPopupService.showErrorPopup(
            `Validation failed: ${this.data.popupState.message}`,
          );
        }
      });
    }
  }
  validateSyntax(formulaString) {
    const RESERVED_FUNCTIONS = [
      "sin",
      "cos",
      "arcsin",
      "arccos",
      "tan",
      "arctan",
      "cot",
      "arccot",
      "asin",
      "acos",
      "atan",
      "acot",
      "sinh",
      "cosh",
      "tanh",
      "asinh",
      "acosh",
      "atanh",
      "sqrt",
      "pi",
      "log",
      "ln",
      "exp",
      "abs",
      "factorial",
      "E",
      "I",
    ];

    const trimmedFormula = (formulaString || "").trim();
    if (!trimmedFormula) {
      this.data.popupState.message = "formula_string is required";
      return false;
    }

    const equalsMatches = trimmedFormula.match(/=/g) || [];
    if (equalsMatches.length !== 1) {
      this.data.popupState.message = "the string must contain exactly one '='";
      return false;
    }

    const [lhs, rhs] = trimmedFormula.split("=");
    if (!lhs.trim() || !rhs.trim()) {
      this.data.popupState.message = "both sides of '=' must be non-empty";
      return false;
    }

    const patternDigitFollowedByTerm = /(\d)([a-zA-Z_]|\()/;
    const patternParenFollowedByTerm = /([)])(\d|[a-zA-Z_]|\()/;
    const workingFormula = trimmedFormula;
    if (
      patternDigitFollowedByTerm.test(workingFormula) ||
      patternParenFollowedByTerm.test(workingFormula)
    ) {
      this.data.popupState.message =
        "the string contains implied multiplication like 3a, 3(a+b): please use explicit (e.g. 3*a)";
      return false;
    }

    const patternWordParen = /\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g;
    const funcMatches = workingFormula.match(patternWordParen) || [];

    for (const match of funcMatches) {
      const funcName = match.slice(0, -1); // to remove the ( at the end
      if (!RESERVED_FUNCTIONS.includes(funcName)) {
        this.data.popupState.message = `the string contains implied multiplication like ${funcName}(something): please use explicit (e.g. ${funcName}*(something))`;
        return false;
      }
    }

    const variables = parseVariables(workingFormula);
    if (variables.length < 1) {
      this.data.popupState.message =
        "the formula must have at least 1 variable";
      return false;
    }

    return true;
    function parseVariables(formulaString) {
      const pattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
      const unfilteredWords = formulaString.match(pattern) || [];
      const uniqueWords = new Set(unfilteredWords);
      let variablesList = Array.from(uniqueWords).filter(
        (word) => !RESERVED_FUNCTIONS.includes(word),
      );
      return variablesList.sort();
    }
  }
}

customElements.define("solver-home-page", SolverHomePage);
