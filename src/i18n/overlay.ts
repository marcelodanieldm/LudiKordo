/**
 * Textos por instrumento (lógica pura). Los idiomas guardan en `guitar.ui` las
 * versiones de guitarra de los textos de `ui` que nombran el bajo («Sin bajo»,
 * «¿Tienes un bajo?»…). En la app de guitarra se superponen; en la de bajo, no.
 */
type Tree = { [k: string]: string | Tree };

function merge(base: Tree, over: Tree): Tree {
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] = typeof v === 'object' && typeof b === 'object' ? merge(b, v) : v;
  }
  return out;
}

export function withInstrumentTexts<T extends object>(translation: T, guitar: boolean): T {
  const tree = translation as unknown as Tree;
  const over = tree.guitar;
  if (!guitar || typeof over !== 'object' || typeof over.ui !== 'object' || typeof tree.ui !== 'object') return translation;
  return { ...tree, ui: merge(tree.ui, over.ui) } as unknown as T;
}
