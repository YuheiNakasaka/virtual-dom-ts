// 仮想DOMを作成する

// <a class="hoge" href="/hoge"></a>
// div => NodeType
// class, href => Attributes
type NodeType = VNode | string | number;
type Attributes = { [key: string]: string | Function };

export interface VNode {
  nodeName: keyof ElementTagNameMap; // div | a | p |...みたいな感じ
  attributes: Attributes;
  children: NodeType[];
}

function isVNode(node: NodeType): node is VNode {
  return typeof node !== "string" && typeof node !== "number";
}

export function h(
  nodeName: keyof ElementTagNameMap,
  attributes: Attributes,
  ...children: NodeType[]
): VNode {
  return {
    nodeName,
    attributes,
    children
  };
}

export interface View<State, Actions> {
  (state: State, actions: Actions): VNode;
}

export function createElement(node: NodeType): HTMLElement | Text {
  if (!isVNode(node)) {
    return document.createTextNode(node.toString());
  }

  const el = document.createElement(node.nodeName);
  setAttributes(el, node.attributes);
  node.children.forEach(child => el.appendChild(createElement(child)));

  return el;
}

export function updateElement(
  parent: HTMLElement,
  oldNode: NodeType,
  newNode: NodeType,
  index = 0
): void {
  if (!oldNode) {
    parent.appendChild(createElement(newNode));
    return;
  }

  const target = parent.childNodes[index];

  if (!newNode) {
    parent.removeChild(target);
    return;
  }

  const changeType = hasChanged(oldNode, newNode);
  switch (changeType) {
    case ChangeType.Type:
    case ChangeType.Text:
    case ChangeType.Node:
      parent.replaceChild(createElement(newNode), target);
      return;
    case ChangeType.Value:
      updateValue(
        target as HTMLInputElement,
        (newNode as VNode).attributes.value as string
      );
      return;
    case ChangeType.Attr:
      updateAttributes(
        target as HTMLElement,
        (oldNode as VNode).attributes,
        (newNode as VNode).attributes
      );
      return;
  }

  if (isVNode(oldNode) && isVNode(newNode)) {
    for (
      let i = 0;
      i < newNode.children.length || i < oldNode.children.length;
      i++
    ) {
      updateElement(
        target as HTMLElement,
        oldNode.children[i],
        newNode.children[i]
      );
    }
  }
}

function setAttributes(target: HTMLElement, attrs: Attributes): void {
  for (let attr in attrs) {
    if (isEventAttr(attr)) {
      const eventName = attr.slice(2);
      target.addEventListener(eventName, attrs[attr] as EventListener);
    } else {
      target.setAttribute(attr, attrs[attr] as string);
    }
  }
}

function updateValue(target: HTMLInputElement, newValue: string) {
  target.value = newValue;
}

function updateAttributes(
  target: HTMLElement,
  oldAttrs: Attributes,
  newAttrs: Attributes
): void {
  for (let attr in oldAttrs) {
    if (!isEventAttr(attr)) {
      target.removeAttribute(attr);
    }
  }
  for (let attr in newAttrs) {
    if (!isEventAttr(attr)) {
      target.setAttribute(attr, newAttrs[attr] as string);
    }
  }
}

function isEventAttr(attr: string): boolean {
  return /^on/.test(attr);
}

enum ChangeType {
  None,
  Type,
  Text,
  Node,
  Value,
  Attr
}

function hasChanged(a: NodeType, b: NodeType): ChangeType {
  if (typeof a !== typeof b) {
    return ChangeType.Type;
  }

  if (!isVNode(a) && a !== b) {
    return ChangeType.Text;
  }

  if (isVNode(a) && isVNode(b)) {
    if (a.nodeName !== b.nodeName) {
      return ChangeType.Node;
    }
    if (a.attributes.value !== b.attributes.value) {
      return ChangeType.Value;
    }
    if (JSON.stringify(a.attributes) !== JSON.stringify(b.attributes)) {
      return ChangeType.Attr;
    }
  }

  return ChangeType.None;
}
