import { Component } from "./component";

const kebabize = (str: string) =>
  str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
  );

export const htmlElements = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
] as const;

type ElementChild =
  | HTMLElement
  | Component
  | ((
      parent?: HTMLElement
    ) => HTMLElement | Component | HTMLElement[] | Component[])
  | null
  | undefined
  | boolean
  | string;

const renderChild = (
  parent: HTMLElement,
  child: ElementChild | ElementChild[]
) => {
  if (child === null || child === undefined) return;
  if (typeof child === "function") child = child(parent);
  if (typeof child === "string")
    parent.appendChild(document.createTextNode(child));
  if (child instanceof HTMLElement) parent.appendChild(child);
  if (typeof child === "object" && "root" in child)
    parent.appendChild(child.root);
  if (Array.isArray(child)) {
    child.forEach((child) => renderChild(parent, child));
  }
};

const setElementAttrs = (element: HTMLElement, attrs?: Record<string, any>) => {
  if (!attrs) return;
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === "gamepadSelectable" && val) {
      setGamepadSelectable(element);
      return;
    }
    if (key === "ref" && typeof val === "function") {
      val(element);
      return;
    }
    if (key === "parent") {
      if (val instanceof HTMLElement) {
        val.appendChild(element);
      }
      return;
    }
    if (key === "style" && typeof val === "object") {
      val = Object.entries(val)
        .map(([key, val]) => `${kebabize(key)}: ${val};`)
        .join(" ");
      element.setAttribute(key, val);
      return;
    }

    if (typeof val === "function") {
      // @ts-ignore
      element[key] = val;
    } else {
      element.setAttribute(key, val);
    }
  });
};

export const el = (
  type: string,
  attrs: Record<string, any>,
  children?: ElementChild | ElementChild[],
  refCallback?: (ref: HTMLElement) => void
) => {
  const element = document.createElement(type);
  setElementAttrs(element, attrs);

  if (Array.isArray(children)) {
    children.forEach((child) => renderChild(element, child));
  } else {
    renderChild(element, children);
  }

  refCallback && refCallback(element);

  return element;
};

export type ElementTagName = (typeof htmlElements)[number];
export type RefCallback = (ref: HTMLElement) => void;
export type ElementAttrs = Record<string, any> & {
  ref?: RefCallback;
  style?: CSSStyleDeclaration | Record<string, string>;
  gamepadSelectable?: boolean;
};

function callableElement(tagName: ElementTagName) {
  function callableInstance(attrs?: ElementAttrs) {
    return (children?: string | ElementChild | ElementChild[]) =>
      el(tagName, attrs, children);
  }

  return callableInstance;
}

export const html = Object.fromEntries(
  htmlElements.map((tagName) => {
    return [tagName, callableElement(tagName)];
  })
) as Record<ElementTagName, ReturnType<typeof callableElement>>;

export const getClosestFocusTarget = (
  direction: "UP" | "RIGHT" | "DOWN" | "LEFT",
  scope?: HTMLElement
): HTMLElement | null => {
  const originElement = document.activeElement ?? document.documentElement;
  const rect = originElement.getBoundingClientRect();
  const scopeElem = scope ?? document.body;
  const insideScope = scopeElem.contains(originElement);
  const isClosestScope =
    originElement.closest("[data-gamepad-dpad-scope]") === scopeElem;
  if (!insideScope || !isClosestScope) return null;
  const allSelectableElements = scopeElem.querySelectorAll(
    "[data-gamepad-selectable]"
  );
  let closestElement: HTMLElement | null = null;
  let closestDistance = Infinity;
  const threshold = Number(
    originElement.getAttribute("data-gamepad-jump-thereshold")
  );

  allSelectableElements.forEach((element) => {
    if (element === originElement) return;
    const elementRect = element.getBoundingClientRect();

    let dx: number | undefined;
    let dy: number | undefined;

    switch (direction) {
      case "RIGHT":
        if (
          elementRect.left >= rect.right &&
          Math.abs(elementRect.top - rect.top) < threshold
        ) {
          dx = elementRect.left - rect.right;
          dy = elementRect.top - rect.top;
        }
        break;
      case "LEFT":
        if (
          elementRect.right <= rect.left &&
          Math.abs(elementRect.top - rect.top) < threshold
        ) {
          dx = rect.left - elementRect.right;
          dy = elementRect.top - rect.top;
        }
        break;
      case "UP":
        if (
          elementRect.bottom <= rect.top &&
          Math.abs(elementRect.left - rect.left) < threshold
        ) {
          dy = rect.top - elementRect.bottom;
          dx = elementRect.left - rect.left;
        }
        break;
      case "DOWN":
        if (
          elementRect.top >= rect.bottom &&
          Math.abs(elementRect.left - rect.left) < threshold
        ) {
          dy = elementRect.top - rect.bottom;
          dx = elementRect.left - rect.left;
        }
        break;
    }

    if (typeof dx === "undefined" || typeof dy === "undefined") return;

    // Calculate a combined distance metric
    const distance =
      direction === "UP" || direction === "DOWN"
        ? dy * dy + dx * dx * 10
        : dx * dx + dy * dy * 10;

    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = element as HTMLElement;
    }
  });

  return closestElement;
};

let observedElements = new Map<Node, () => void>();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.removedNodes.length) {
      mutation.removedNodes.forEach((removedNode) => {
        if (observedElements.has(removedNode)) {
          console.log(removedNode, "Removed");
          observedElements.get(removedNode)();
          observedElements.delete(removedNode);
        }
      });
    }
  });
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

export const onElementRemoved = (
  element: HTMLElement,
  callback: () => void
) => {
  if (!(element instanceof HTMLElement)) {
    throw new Error("Element must be an HTMLElement");
  }
  observedElements.set(element, callback);
};

export const mount = (
  query: string,
  html: string | HTMLElement | Component,
  postMountCallback?: (root: HTMLElement) => void
) => {
  const target = document.querySelector(query);
  if (!target) return;
  if (typeof html === "string") {
    target.innerHTML = html;
  } else if ("root" in html) {
    target.appendChild(html.root);
    onElementRemoved(html.root, html.cleanup);
  } else {
    target.appendChild(html);
  }
  postMountCallback && postMountCallback(target as HTMLElement);
  return target;
};

export const isFocusedWithin = (element: HTMLElement) => {
  if (!document.activeElement) return false;
  const isChild = element.contains(document.activeElement);

  return isChild || document.activeElement === element;
};

export const noElementFocused = () =>
  document.activeElement === null || document.activeElement === document.body;

export const setGamepadSelectable = (
  element: HTMLElement,
  selectable = true
) => {
  if (selectable) {
    element.setAttribute("tabindex", "0");
    element.setAttribute("data-gamepad-selectable", "true");
    element.setAttribute("data-gamepad-jump-thereshold", "30");
  } else {
    element.removeAttribute("tabindex");
    element.removeAttribute("data-gamepad-selectable");
    element.removeAttribute("data-gamepad-jump-thereshold");
  }

  return element;
};
