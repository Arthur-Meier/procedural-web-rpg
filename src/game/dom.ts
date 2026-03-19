export function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Elemento com id "${id}" nao foi encontrado.`);
  }

  return element as T;
}
