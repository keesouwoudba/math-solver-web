import "/frontend/components/UiPopup/UiPopup.js";

export default class PopupService {
  realDOM;
  data;
  constructor(realDOM, data) {
    this.realDOM = realDOM;
    this.data = data;
  }
  showErrorPopup(message) {
    this.data.popupState = {
      isVisible: true,
      message: message,
    };
    const popup = document.createElement("ui-popup");
    popup.setPopupService(this);
    this.realDOM.appendChild(popup);
    popup.setMsg(message);
    popup.setIcon("⚠️");
    popup.setTitle("Error");
  }

  showDefaultPopup(message) {
    this.data.popupState = {
      isVisible: true,
      message: message,
    };
    const popup = document.createElement("ui-popup");
    popup.setPopupService(this);
    this.realDOM.appendChild(popup);
    popup.setMsg(message);
    popup.setIcon("ℹ️");
    popup.setTitle("Info");
  }

  hidePopup() {
    this.data.popupState = {
      isVisible: false,
      message: "",
    };
    const popup = this.realDOM.querySelector("ui-popup");
    if (popup) {
      popup.remove();
    }
  }
}
