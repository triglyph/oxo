export function clearElement(element) {
  while (element.hasChildNodes()) {
    element.lastChild.remove();
  }
}