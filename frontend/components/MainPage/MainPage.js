import Router from "../../services/Router.js";

export class MainPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const template = document.querySelector("#main-page-template");
    if (!template) return;
    const content = template.content.cloneNode(true);
    this.appendChild(content);
    this.attachEventListeners();
  }

  attachEventListeners() {
    const solverLink = this.querySelector(".box-launch-solver");
    if (!solverLink) return;

    solverLink.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("MainPage: box-launch-solver clicked, navigating to /solver");
      Router.go("/solver");
    });
  }
}
customElements.define("main-page", MainPage);
