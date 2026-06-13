## 0.0.1-alpha.1 (2026-06-12)

### 🚀 Features

- ⚠️  **editor:** rename public api to qalma ([17e7ff3](https://github.com/cdskill/qalma/commit/17e7ff3))
- **editor:** add image plugin ([2963fa3](https://github.com/cdskill/qalma/commit/2963fa3))
- **editor:** add headless mention plugin ([7ab9ea2](https://github.com/cdskill/qalma/commit/7ab9ea2))
- **plugins:** add paste rules plugin ([71a0c51](https://github.com/cdskill/qalma/commit/71a0c51))
- **editor:** add subscript superscript plugin ([23316d4](https://github.com/cdskill/qalma/commit/23316d4))
- **editor:** add trailing paragraph plugin ([0fb7a66](https://github.com/cdskill/qalma/commit/0fb7a66))
- **editor:** add placeholder plugin ([71897d7](https://github.com/cdskill/qalma/commit/71897d7))
- **editor:** add highlight plugin ([27f6720](https://github.com/cdskill/qalma/commit/27f6720))
- **editor:** add color plugin ([ba5e568](https://github.com/cdskill/qalma/commit/ba5e568))
- **editor:** add text alignment plugin ([d2ad48b](https://github.com/cdskill/qalma/commit/d2ad48b))
- **editor:** add hard break plugin ([d18edbe](https://github.com/cdskill/qalma/commit/d18edbe))
- **editor:** add clear formatting plugin ([fa6cf1a](https://github.com/cdskill/qalma/commit/fa6cf1a))
- **editor:** add code block plugin ([3c7efb4](https://github.com/cdskill/qalma/commit/3c7efb4))
- **editor:** add blockquote plugin ([32d1d9e](https://github.com/cdskill/qalma/commit/32d1d9e))
- **editor:** add headings and lists plugins ([1e25877](https://github.com/cdskill/qalma/commit/1e25877))
- **editor:** add headless link plugin ([7cad9b3](https://github.com/cdskill/qalma/commit/7cad9b3))
- **editor:** add headless plugin-based ProseMirror foundation ([b4aa486](https://github.com/cdskill/qalma/commit/b4aa486))

### 🩹 Fixes

- **editor:** expose commandStates for unset color commands ([4a3225b](https://github.com/cdskill/qalma/commit/4a3225b))
- ⚠️  **editor:** move placeholder rendering into PlaceholderPlugin ([dbf254b](https://github.com/cdskill/qalma/commit/dbf254b))
- ⚠️  **editor:** make image node inline and validate insertion via schema ([767dd90](https://github.com/cdskill/qalma/commit/767dd90))
- **editor:** defer content mount until browser render ([f168213](https://github.com/cdskill/qalma/commit/f168213))

### ⚠️  Breaking Changes

- **editor:** move placeholder rendering into PlaceholderPlugin  ([dbf254b](https://github.com/cdskill/qalma/commit/dbf254b))
  remove QalmaEditorOptions.placeholder,
  QalmaEditorController.placeholder, and setPlaceholder().
- **editor:** make image node inline and validate insertion via schema  ([767dd90](https://github.com/cdskill/qalma/commit/767dd90))
  the image node is now inline; documents serialized
  with a top-level <img> will be re-wrapped in a paragraph on parse.
- **editor:** rename public api to qalma  ([17e7ff3](https://github.com/cdskill/qalma/commit/17e7ff3))
  public editor APIs, selectors, CSS hooks, mention attributes, and command directives now use Qalma names.