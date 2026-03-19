export function getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Elemento com id "${id}" nao foi encontrado.`);
    }
    return element;
}
