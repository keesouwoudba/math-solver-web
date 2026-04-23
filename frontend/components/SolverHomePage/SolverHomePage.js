import VDOMService from "../../services/vDOMService.js";

//shorthands
const $ = function(args){ return document.querySelector(args);}
const $$ = function(args){ return document.querySelectorAll(args);}
//returns nodelist, thats why do [...el.$("needed")] to make it array with methods like map filter.



export class SolverHomePage extends HTMLElement {
    MyVDOMService;
    prevDOM;
    elems;
    data;
    vDOM;
    dynamicVDOM = [
            {tag: "div", className: "workspace-card", id: "", 
                children: [
                    {tag: "label", className:"formula-input", value:"Workspace"}, 
                    {tag: "textarea", className:"textfield", placeholder: "Enter Formula", id: "formula-input", value: ""}
                ]
            }, 
            {tag: "div", className: "keypad",
                children: [
                    {tag: "div", className : "btn-switcher-container", id: "btn-switcher-container",
                        children: [
                            {tag: "button", className: "btn-switcher active", id: "btn-algebraic", "datatarget" : "keypad-algebraic", value: "Algebra"},
                            {tag: "button", className: "btn-switcher", id: "btn-trig", "datatarget": "keypad-trig", value: "Trig"}
                        ]
                    },
                    {tag: "div", className: "keypad-grid active", id:"keypad-algebraic", 
                        children :[
                            {tag: "button", className: "button-white", value: "+"},
                            {tag: "button", className: "button-white", value: "-"},
                            {tag: "button", className: "button-white", value: "*"},
                            {tag: "button", className: "button-white", value: "/"}, 
                            {tag: "button", className: "button-white", value: "()**()"},
                            {tag: "button", className: "button-white", value: "sqrt()"},
                            {tag: "button", className: "button-white", value: "log()"},
                            {tag: "button", className: "button-white", value: "ln()"}

                        ]
                    },
                    {tag: "div", className: "keypad-grid", id: "keypad-trig", 
                        children: [
                            {tag: "button", className: "button-white", value: "sin()"}, 
                            {tag: "button",className: "button-white", value: "cos()"},
                            {tag: "button",className: "button-white", value: "tan()" },
                            {tag: "button",className: "button-white", value: "cot()"}, 
                            {tag: "button",className: "button-white", value: "csc()"},
                            {tag: "button",className: "button-white", value: "sec()"}
                        ]
                    }
                ]
            }
        ];

    
   
    constructor(){
        super();
        this.root = this.attachShadow({"mode": "open"});
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
                userCurrentInput: "", 
                vDOM: this.vDOM, 
                prevDOM: this.prevDOM,
                elems: this.elems, 
                onlySusceptible: true, 
                susceptibleIndexes: [0]
            };
            this.MyVDOMService = new VDOMService(this.root, this.data);
        };

        loadCSS();
        activateVDOM();
        
    }
    //once element is on the page
    connectedCallback(){
        console.log("SolverHomePage: connectedCallback called");
        this.MyVDOMService.updateDOM();
    }
    attachEventListeners(){

    }
}

    

customElements.define("solver-home-page", SolverHomePage);





//add this later to the buttons
{/*
    
    <script>
  const buttons = document.querySelectorAll('.tab-btn');
  const panels  = document.querySelectorAll('.tab-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // remove active from all buttons and panels
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p  => p.classList.remove('active'));

      // activate clicked button and its matching panel
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });
</script> */}


