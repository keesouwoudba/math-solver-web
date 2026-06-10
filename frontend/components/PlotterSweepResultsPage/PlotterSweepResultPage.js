import VDOMService from "../../services/vDOMService.js";
import PopupService from "../../services/PopupService.js";
import ScreenContextService from "../../services/ScreenContextService.js";
import API from "../../services/API.js";
import Router from "../../services/Router.js";
import UiPopup from "../UiPopup/UiPopup.js";

export class PlotterSweepResultPage extends HTMLElement {
  constructor() {
    super();
  }
}
customElements.define("plotter-sweep-result-page", PlotterSweepResultPage);
