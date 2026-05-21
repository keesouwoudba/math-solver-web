export default class Handlers {
  static tabSwitchHandler(buttons, panels, btn, targetPanel) {
    //remove active from all buttons and panels
    buttons.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));

    //activate clicked button and its matching panel
    btn.classList.add("active");
    if (!targetPanel) {
      return;
    }
    targetPanel.classList.add("active");
  }

  static focusinHandler(event) {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return false;
    }
    if (target.id !== "formula-input") {
      return false;
    }
    console.log(`SolverHomePage: Textarea focused`);
    return true;
  }

  static focusoutHandler(event) {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return false; //not focusout on textarea
    }
    if (target.id !== "formula-input") {
      return false; //not focusout on the specific textarea we care about
    }
    console.log(`SolverHomePage: Textarea focusout`);
    return true; //yes, it is focusout
  }

  static inputChangeHandler(event) {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return null;
    }
    if (target.id !== "formula-input") {
      return null;
    }
    return {
      status: true,
      current: target.value,
      selectionStart: target.selectionStart,
      selectionEnd: target.selectionEnd,
      isFocused: target.matches(":focus"),
    };
  }

  static backspaceButtonHandler(val, s, e) {
    let nextValue = val;
    let nextPos = s;
    if (s !== e) {
      nextValue = val.slice(0, s) + val.slice(e);
      nextPos = s;
    } else if (s > 0) {
      nextValue = val.slice(0, s - 1) + val.slice(e);
      nextPos = s - 1;
    }
    return {
      current: nextValue,
      selectionStart: nextPos,
      selectionEnd: nextPos,
      isFocused: true,
    };
  }

  static operatorButtonHandler(inputStateRef, valueToInsert, id) {
    if (!valueToInsert.includes("()**()")) {
      //  +-*/ operators
      const current = `${inputStateRef.current.slice(0, inputStateRef.selectionStart)} ${valueToInsert} ${inputStateRef.current.slice(inputStateRef.selectionEnd)}`;
      const newCaretPosition =
        inputStateRef.selectionStart + valueToInsert.length + 2; // to move cursor after the inserted operator and spaces

      return {
        current,
        selectionStart: newCaretPosition,
        selectionEnd: newCaretPosition,
        isFocused: true,
      };
    } else {
      //for pow operator: identify if there is something already that can be raised onto power. check with regex. if there is something valid, then insert that thing into first parentheses, and put cursor in second parentheses, if there is nothing valid to raise to power, just insert ()**() and put cursor in the middle of first parentheses
      const beforeCursor = inputStateRef.current.slice(
        0,
        inputStateRef.selectionStart,
      ); //x + 1
      const regex = /([a-zA-Z0-9\)]+)$/; // better make a capturing group for the last valid thing to raise to the power
      const match = beforeCursor.match(regex);
      if (match) {
        const toWrap = match?.[match.length - 1] || "";
        const startIdx = inputStateRef.selectionStart - toWrap.length; //x*1 + {|6}vvv{|9} -> x*1 + ({|789}vvv)**({|14})
        const current = `${inputStateRef.current.slice(0, startIdx)}(${toWrap})**() ${inputStateRef.current.slice(inputStateRef.selectionStart)}`;
        const newCaretPosition = startIdx + toWrap.length + 5; //x*1 + {|6 in v}vvv{|9} -> x*1 + ({|789}vvv)**({|14}), to move cursor inside second parentheses

        return {
          current,
          selectionStart: newCaretPosition,
          selectionEnd: newCaretPosition,
          isFocused: true,
        };
      } else {
        //means there is nothing to wrap, just insert ()**() and put cursor in the middle of first parentheses
        const current = `${inputStateRef.current.slice(0, inputStateRef.selectionStart)} ()**() ${inputStateRef.current.slice(inputStateRef.selectionEnd)}`;
        const newCaretPosition = inputStateRef.selectionStart + 2; //to move cursor in the middle of first parentheses

        return {
          current,
          selectionStart: newCaretPosition,
          selectionEnd: newCaretPosition,
          isFocused: true,
        };
      }
    }
  }
  static functionButtonHandler(inputStateRef, valueToInsert, id) {
    const beforeCursor = inputStateRef.current.slice(
      0,
      inputStateRef.selectionStart,
    );
    const regex = /([a-zA-Z0-9\)]+)$/;
    const match = beforeCursor.match(regex);
    const lastMatch = match?.[match.length - 1] || "";
    if (match) {
      //there is smth before cursor that can be multiplied, so insert * before function
      const current = `${inputStateRef.current.slice(0, inputStateRef.selectionStart)} * ${valueToInsert}${inputStateRef.current.slice(inputStateRef.selectionEnd)}`;
      const newCaretPosition =
        inputStateRef.selectionStart + 3 + valueToInsert.indexOf("()") + 1; //to move cursor in the middle of parentheses of function

      return {
        current,
        selectionStart: newCaretPosition,
        selectionEnd: newCaretPosition,
        isFocused: true,
      };
    } else {
      //there is nothing valid to multiply, just insert function() and put cursor in the middle of parentheses
      //insert function with parentheses and put cursor in the middle
      const current = `${inputStateRef.current.slice(0, inputStateRef.selectionStart)} ${valueToInsert}${inputStateRef.current.slice(inputStateRef.selectionEnd)}`;
      const newCaretPosition =
        inputStateRef.selectionStart + 1 + valueToInsert.indexOf("()") + 1; //move cursor to the middle of parentheses
      // ff *-> ff * sin(|)

      return {
        current,
        selectionStart: newCaretPosition,
        selectionEnd: newCaretPosition,
        isFocused: true,
      };
    }
  }
}
