import { onElementRemoved } from "./html";

export type Component = {
  root: HTMLElement;
  cleanup: () => void;
};

export type ComponentBaseProps = {
  parent?: HTMLElement;
};

export function component<T, R = {}>(render: (props?: T) => Component & R) {
  return (
    props?: T & ComponentBaseProps,
    refCallback?: (ref: Component & R) => void
  ) => {
    const data = render(props);
    refCallback && refCallback(data);
    props?.parent && props.parent.appendChild(data.root);
    data.root.parentElement && onElementRemoved(data.root, data.cleanup);
    return data as typeof data;
  };
}
