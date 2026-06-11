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

  static handleInputChange(event) {
    const target = event.target;
    if (
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLInputElement)
    ) {
      console.warn(
        `plotterSweeperConfigPagehandler: Input change event ignored, not an input or textarea`,
      );
      return null;
    }
    const includesFormInput = target.matches(".form-input");
    const includesFormRange = target.matches(".form-input-range");
    if (!includesFormInput && !includesFormRange) {
      console.warn(
        `plotterSweeperConfigPagehandler: Input change event ignored, not a form input or range`,
      );
      return null;
    }
    let name;
    let blockKey;
    if (includesFormRange) {
      name =
        target.id.split("-")[1] ??
        target.id.match(/^range-(?<name>.+)$/)?.groups?.name;
      blockKey = "performSweep";
    }
    if (includesFormInput) {
      name =
        target.id.split("-")[1] ??
        target.id.match(/^const-(?<name>.+)$/)?.groups?.name;
      blockKey = "verifyFixed";
    }
    const finalObj = {
      name,
      blockKey,
      current: target.value,
      selectionStart: target.selectionStart,
      selectionEnd: target.selectionEnd,
      isFocused: true,
    };
    console.warn(
      `plotterSweeperConfigPagehandler: Input change detected, final:${JSON.stringify(finalObj)}`,
    );

    return finalObj;
  }
}
