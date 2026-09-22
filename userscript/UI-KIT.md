# Starwork — MagicBro UI kit

An original visual system for selecting an idea and turning it into a code change.

## Tokens

Tokens live in the `:host` rule in `magicbro.user.js` and stay isolated from the page.

| Token | Role |
| --- | --- |
| `--mb-night` | Ink-blue panel background |
| `--mb-surface` | Raised controls |
| `--mb-line` | Control boundaries |
| `--mb-ink` | Main text |
| `--mb-muted` | Secondary text and hints |
| `--mb-gold` | Primary action and selection |
| `--mb-star` | Context and tool activity |
| `--mb-danger` | Errors and stopping |

## Components

- Launcher: asymmetric rounded silhouette with a golden star.
- Selection: precise gold outline with a restrained halo.
- Editor: solid ink panel, gold top edge and a spacious textarea.
- Composer: full-width golden action below the input.
- Settings: labeled native selects, kept keyboard accessible.
- Activity: orbital indicator, readable event rows and a visible stop button.

Keep magical details around controls, never over their text. Reserve gold for the primary action and selection; use mint for context. Use system fonts without remote font requests. Focus rings must remain visible. Honor reduced motion for every animation, including the progress indicator. Keep existing element IDs used by interaction logic; component styling is scoped to the closed Shadow DOM.

The UI is embedded in the userscript so it also works when installed directly in a userscript manager. After editing, run `npm run check --prefix cli` to validate JavaScript and refresh packaged assets.
