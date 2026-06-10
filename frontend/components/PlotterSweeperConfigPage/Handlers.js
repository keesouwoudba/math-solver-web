export default class Handlers {
  static handleRadioButtonChange(target, radioGroupReference) {
    const radioGroupReferenceCopy = { ...radioGroupReference };
    const variableName = target.value;
    radioGroupReferenceCopy.currentChosen = variableName;
    radioGroupReferenceCopy.isChosen = true;
    //update isChecked for each option
    Object.entries(radioGroupReferenceCopy.variables).forEach(
      ([key, stateRef]) => {
        stateRef.isChecked = key === `sweeper-option-${variableName}`;
      },
    );
    return radioGroupReferenceCopy;
  }

  static inputChangeHandler(event) {
    const target = event.target;
    if (
      !(target instanceof HTMLTextAreaElement) ||
      !(target instanceof HTMLInputElement)
    ) {
      return null;
    }
    const includesFormInput = target.className.includes("form-input");
    const includesFormRange = target.className.includes("form-input-range");
    if (!includesFormInput || !includesFormRange) {
      return null;
    }
    let name;
    let blockKey;
    if (includesFormRange) {
      name =
        target.id.split("-")[1] ??
        target.id.match(/^range-(?<name>.+)$/)?.groups?.name;
      blockKey = "verifyRange";
    }
    if (includesFormInput) {
      name =
        target.id.split("-")[1] ??
        target.id.match(/^const-(?<name>.+)$/)?.groups?.name;
      blockKey = "verifyFixed";
    }

    return {
      name,
      blockKey,
      type,
      current: target.value,
      selectionStart: target.selectionStart,
      selectionEnd: target.selectionEnd,
      isFocused: target.matches(":focus"),
    };
  }
}
