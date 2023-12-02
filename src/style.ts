import {
  ElementTagName,
  htmlElements,
  html,
  RefCallback,
  ElementAttrs,
} from "./html";

const loadedStyles: string[] = [];

const mountStyle = (css: string) => {
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.append(style);
};

export const style = (css: any) => {
  css = String(css.join(" "));
  if (loadedStyles.includes(css)) return;

  mountStyle(css);
  loadedStyles.push(css);
};

const generateId = () => {
  const chars = "abcdefghijklmnoprstuvxyz0123456789";

  return `styled-${Array(5)
    .fill(null)
    .map((_) => chars[Math.round(Math.random() * (chars.length - 1))])
    .join("")}`;
};

const classMap = new Map<string, string>();

export const cssClass = function (css: any) {
  css = String(css.join(" "));

  const existsInClassMap = classMap.has(css);
  if (!existsInClassMap) {
    const id = generateId();
    css = `.${id} {
      ${css}
    }`;
    mountStyle(css);
    return id;
  } else {
    return classMap.get(css);
  }
};

const styledRenderFunc = function (tagName: ElementTagName) {
  const func = function (css: any) {
    const className = cssClass(css);

    return function (attrs?: ElementAttrs) {
      if (attrs) {
        if (attrs?.class) {
          attrs.class = `${className} ${attrs.class}`;
        } else {
          attrs.class = className;
        }
      } else {
        attrs = { class: className };
      }

      return html[tagName](attrs);
    };
  };

  return func;
};

type StyledComponentSet = Record<
  ElementTagName,
  ReturnType<typeof styledRenderFunc>
>;

export const styled: StyledComponentSet = Object.fromEntries(
  htmlElements.map((tagName) => {
    return [tagName, styledRenderFunc(tagName)];
  })
) as StyledComponentSet;
