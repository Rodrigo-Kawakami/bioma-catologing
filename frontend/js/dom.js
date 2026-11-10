export function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (name.startsWith('on')) element.addEventListener(name.slice(2), value);
    else if (name === 'value') element.value = value;
    else if (value === true) element.setAttribute(name, '');
    else if (value !== false && value !== null && value !== undefined) element.setAttribute(name, value);
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    element.append(child.nodeType ? child : document.createTextNode(child));
  });
  return element;
}

export function generateId() {
  return crypto.randomUUID();
}
