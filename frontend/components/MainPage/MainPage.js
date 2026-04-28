function $(args) { return document.querySelector(args); }
function $$(args) { return document.querySelectorAll(args);}


export class MainPage extends HTMLElement {
    constructor(){
        super();
    }

    connectedCallback(){
        const template = $("#main-page-template");
        if (!template) return;
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        this.attachEventListeners();
    }

    attachEventListeners(){
        const solverLink = $(".box-launch-solver");
        if (!solverLink) return;

        solverLink.on("click", (event) => {
            event.preventDefault();
            console.log("MainPage: box-launch-solver clicked, navigating to /solver");
            app.router.go("/solver");
        });
    }

};
customElements.define("main-page", MainPage);