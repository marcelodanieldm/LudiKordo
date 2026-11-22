/**
 * Textos por instrumento (lógica pura). Los idiomas guardan en `guitar.ui` las
 * versiones de guitarra de los textos de `ui` que nombran el bajo («Sin bajo»,
 * «¿Tienes un bajo?»…). En las apps de guitarra se superponen; en la de bajo, no.
 * En la criolla se superpone además `nylon.ui` («guitarra criolla» en vez de
 * «guitarra eléctrica», sin ampli).
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

function overlay(ui: Tree, over: string | Tree | undefined): Tree {
  return typeof over === 'object' && typeof over.ui === 'object' ? merge(ui, over.ui) : ui;
}

export function withInstrumentTexts<T extends object>(translation: T, guitar: boolean, nylon = false): T {
  const tree = translation as unknown as Tree;
  if (!guitar || typeof tree.ui !== 'object') return translation;
  const ui = overlay(tree.ui, tree.guitar);
  return { ...tree, ui: nylon ? overlay(ui, tree.nylon) : ui } as unknown as T;
}
