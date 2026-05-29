export default class VDOMService {
  realDOM;
  data;
  constructor(realDOM, data) {
    this.realDOM = realDOM;
    this.data = data;
    this.convertNode = this.convertNode.bind(this);
  }

  static createVDOM(dynamicVDOM) {
    return dynamicVDOM;
  }
  createVDOM() {
    return this.data.vDOM;
  }
  takeSnapshot() {
    this.data.prevVDOM = JSON.parse(JSON.stringify(this.data.vDOM));
    console.log(`VDOMService: Snapshot taken. prevVDOM: `, this.data.prevVDOM);
  }

  updateDOM(traceback) {
    if (this.data.elems == undefined) {
      this.data.elems = this.data.vDOM.map(this.convertNode);
      this.realDOM.append(...this.data.elems);
    } else {
      console.log(`VDOMService: Updating DOM for traceback: ${traceback}`);
      const patches = this.diff(this.data.prevVDOM, this.data.vDOM);
      console.log(`VDOMService: ${traceback} patches: `, patches);
      this.data.elems = this.patch(this.data.elems, patches);
    }
  }

  diff(prevVDOM, newVDOM) {
    const patches = [];
    if (this.data.onlySusceptible) {
      console.log(
        `VDOMService: Diffing only susceptible indexes: ${this.data.susceptibleIndexes}`,
      );
      this.data.susceptibleIndexes.forEach((i) => {
        if (JSON.stringify(prevVDOM[i]) !== JSON.stringify(newVDOM[i])) {
          patches.push({
            index: i,
            newNode: newVDOM[i],
            prevNode: prevVDOM[i],
          });
        }
      });
      return patches;
    } else {
      for (let i = 0; i < Math.max(prevVDOM.length, newVDOM.length); i++) {
        const prevNode = prevVDOM[i];
        const newNode = newVDOM[i];
        if (JSON.stringify(prevNode) !== JSON.stringify(newNode)) {
          patches.push({ index: i, newNode: newNode, prevNode: prevNode });
        }
      }
      return patches;
    }
  }
  patch(elems, patches) {
    elems = [...elems];
    patches.forEach((patch) => {
      this.patchNode(elems, patch, null);
    });
    return elems;
  }
  //recursive patcher
  patchNode(elems, patch, parentEl = null) {
    const { prevNode, newNode, index } = patch || {};

    const oldNode = prevNode || null;
    const nextNode = newNode || null;

    const {
      tag: oldTag,
      id: oldId,
      className: oldClassName,
      placeholder: oldPlaceholder,
      textContent: oldTextContent,
      href: oldHref,
      title: oldTitle,
      stateRef: oldStateRef,
      children: oldChildren,
    } = oldNode || {};
    const {
      tag: newTag,
      id: newId,
      className: newClassName,
      placeholder: newPlaceholder,
      textContent: newTextContent,
      href: newHref,
      title: newTitle,
      stateRef: newStateRef,
      children: newChildren,
    } = nextNode || {};

    const applyFocusState = (targetEl, stateRef) => {
      if (!targetEl || !stateRef || !stateRef.isFocused) {
        return;
      }
      if (
        targetEl instanceof HTMLInputElement ||
        targetEl instanceof HTMLTextAreaElement
      ) {
        const start = stateRef.selectionStart;
        const end = stateRef.selectionEnd;
        targetEl.focus();
        if (start !== null && start !== undefined) {
          const max = targetEl.value.length;
          const s = Math.min(start, max);
          const e = Math.min(end ?? s, max);
          try {
            targetEl.setSelectionRange(s, e);
          } catch (e) {
            /* do nothing */
          }
        }
      } else {
        try {
          targetEl.focus();
        } catch (e) {
          /* do nothing */
        }
      }
    };

    // find existing element in the DOM
    var el = null;
    if (oldId) {
      try {
        el = this.realDOM.querySelector(`#${CSS.escape(oldId)}`);
      } catch (e) {
        el = this.realDOM.querySelector("#" + oldId);
      }
    } else if (parentEl && typeof index == "number") {
      el = parentEl.children[index] || null;
    } else if (typeof index == "number") {
      el = elems[index] || null;
    }

    // If both nodes exist and same tag+id -> update in place
    if (
      oldNode &&
      nextNode &&
      oldTag !== undefined &&
      newTag !== undefined &&
      oldTag === newTag &&
      oldId !== undefined &&
      newId !== undefined &&
      oldId === newId &&
      el
    ) {
      if (oldClassName !== newClassName) {
        el.className = newClassName ?? "";
      }

      const oldValue = oldStateRef?.current ?? (oldNode && oldNode.value);
      const newValue = newStateRef?.current ?? (nextNode && nextNode.value);
      const oldText =
        oldTextContent !== undefined
          ? oldTextContent
          : (oldStateRef?.current ?? (oldNode && oldNode.value));
      const newText =
        newTextContent !== undefined
          ? newTextContent
          : (newStateRef?.current ?? (nextNode && nextNode.value));

      //
      if (
        oldValue !== newValue &&
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      ) {
        el.value = newValue ?? "";
      }

      if (
        oldText !== newText &&
        !(
          el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ) &&
        (!Array.isArray(newChildren) || newChildren.length === 0)
      ) {
        el.textContent = String(newText ?? "");
      }

      if (oldPlaceholder !== newPlaceholder && "placeholder" in el) {
        el.placeholder = newPlaceholder ?? "";
      }

      if (oldHref !== newHref && "href" in el) {
        if (newHref === undefined || newHref === null) {
          el.removeAttribute("href");
        } else {
          el.setAttribute("href", newHref);
        }
      }

      if (oldTitle !== newTitle) {
        if (newTitle === undefined || newTitle === null) {
          el.removeAttribute("title");
        } else {
          el.setAttribute("title", newTitle);
        }
      }

      applyFocusState(el, newStateRef);

      // it works only if the position of children is not changed, but still they are fully replaced,
      if (Array.isArray(oldChildren) || Array.isArray(newChildren)) {
        const oc = Array.isArray(oldChildren) ? oldChildren : [];
        const nc = Array.isArray(newChildren) ? newChildren : [];
        const maxLength = Math.max(oc.length, nc.length);
        for (let i = 0; i < maxLength; i++) {
          const ocNode = oc[i] || null;
          const ncNode = nc[i] || null;
          if (ocNode === null && ncNode !== null) {
            el.appendChild(this.convertNode(ncNode));
            continue;
          }
          if (ocNode !== null && ncNode === null) {
            const childEl =
              ocNode && ocNode.id
                ? this.realDOM.querySelector(`#${CSS.escape(ocNode.id)}`)
                : el.children[i];
            if (childEl) {
              childEl.remove();
            }
            continue;
          }
          if (ocNode !== null && ncNode !== null) {
            this.patchNode(
              elems,
              {
                prevNode: ocNode,
                newNode: ncNode,
                index: i,
              },
              el,
            );
          }
        }
      }
      return;
    }

    // Otherwise we need to replace/insert at correct place
    const newEl = nextNode ? this.convertNode(nextNode) : null;
    if (parentEl) {
      if (el) {
        if (newEl) {
          el.replaceWith(newEl);
          applyFocusState(newEl, newStateRef);
        } else {
          el.remove();
        }
      } else {
        if (newEl) {
          parentEl.appendChild(newEl);
          applyFocusState(newEl, newStateRef);
        }
      }
      return;
    }

    // top-level replacement in elems array
    if (index !== undefined && typeof index == "number") {
      if (elems[index]) {
        if (newEl) {
          elems[index].replaceWith(newEl);
          elems[index] = newEl;
          applyFocusState(newEl, newStateRef);
        } else {
          elems[index].remove();
          elems[index] = undefined;
        }
      } else {
        if (newEl) {
          this.realDOM.appendChild(newEl);
          elems[index] = newEl;
          applyFocusState(newEl, newStateRef);
        }
      }
    }
  }
  convertNode(node) {
    if (typeof node == "object" && node !== null && node.tag) {
      const {
        tag,
        className,
        value,
        textContent,
        stateRef,
        placeholder,
        datatarget,
        href,
        title,
        type,
        name,
        ariaHidden,
        id,
        children,
        ["data-target"]: dataTargetAttr,
        ["aria-hidden"]: ariaHiddenAttr,
      } = node;

      const el = document.createElement(tag);
      if (className !== undefined) {
        el.className = className;
      }
      const nodeValue = stateRef?.current ?? value;
      if (nodeValue !== undefined) {
        el.value = nodeValue;
      }
      const nodeText =
        textContent !== undefined
          ? textContent
          : tag === "button" || tag === "label"
            ? nodeValue
            : undefined;
      if (
        nodeText !== undefined &&
        (!Array.isArray(children) || children.length === 0)
      ) {
        el.textContent = String(nodeText);
      }
      if (placeholder !== undefined) {
        el.placeholder = placeholder;
      }
      if (href !== undefined) {
        el.setAttribute("href", href);
      }
      if (title !== undefined) {
        el.setAttribute("title", title);
      }
      if (type !== undefined) {
        el.setAttribute("type", type);
      }
      if (name !== undefined) {
        el.setAttribute("name", name);
      }
      const ariaHiddenValue = ariaHidden ?? ariaHiddenAttr;
      if (ariaHiddenValue !== undefined) {
        el.setAttribute("aria-hidden", String(ariaHiddenValue));
      }
      const dataTarget = datatarget ?? dataTargetAttr;
      if (dataTarget !== undefined) {
        el.setAttribute("data-target", dataTarget);
      }
      if (id !== undefined) {
        el.id = id;
      }
      if (children !== undefined && Array.isArray(children)) {
        if (children.length >= 1) {
          children.forEach((child) => {
            el.appendChild(this.convertNode(child));
          });
        }
      }
      return el;
    } else {
      console.error(`SolverHomePage: Invalid node in convertNode: ${node}`);
      return document.createTextNode("");
    }
  }
}
