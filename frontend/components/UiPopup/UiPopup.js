export class UiPopup extends HTMLElement {
  MyPopupService;
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const template = document.querySelector("#ui-popup-template");
    if (!template) return;
    const content = template.content.cloneNode(true);
    this.root.appendChild(content);
    this.loadCss();
    this.activateOverlay();
    this.addEventListeners();
  }

  loadCss() {
    const style = document.createElement("style");
    style.textContent = `@import "/frontend/components/UiPopup/UiPopup.css";`;
    this.root.appendChild(style);
  }
  setMsg(message) {
    const errorEl = this.root.querySelector("#your-message");
    if (errorEl) {
      errorEl.textContent = message;
    }
  }
  setPopupService(popupService) {
    this.MyPopupService = popupService;
  }
  setIcon(icon) {
    const iconEl = this.root.querySelector(".icon");
    if (iconEl) {
      iconEl.textContent = icon;
    }
  }
  setTitle(title) {
    const titleEl = this.root.querySelector("#title");
    if (titleEl) {
      titleEl.textContent = title;
    }
  }
  addEventListeners() {
    const closeButton = this.root.querySelector(".close-btn");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        if (this.MyPopupService) {
          this.MyPopupService.hidePopup();
        }
      });
    }
  }

  activateOverlay() {
    const overlay = this.root.querySelector(".modal-overlay");
    if (overlay) {
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
    }
  }
}
customElements.define("ui-popup", UiPopup);
