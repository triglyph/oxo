export function divfactory(id = undefined, text = undefined, ...classList) {
  const div = document.createElement('div');
  if (id) {
    div.setAttribute('id', id);
  }
  if (text) {
    div.appendChild(document.createTextNode(text));
  }
  div.classList.add(...classList);
  return div;
}//divfactroy