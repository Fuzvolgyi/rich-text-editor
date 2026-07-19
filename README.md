# @zenitnet/rich-text-editor

A lightweight rich text editor for Angular. Zero third-party dependencies — uses the browser's native `contenteditable` and `execCommand` APIs.

## Features

- Bold, Italic, Underline
- Ordered and Unordered lists
- Links (insert, edit, remove) with `target="_blank"`
- Headings (H3 toggle)
- Paste cleanup (strips unwanted HTML)
- Character count with max length
- Configurable toolbar
- Reactive Forms support (ControlValueAccessor)
- XSS-safe HTML rendering pipe
- Standalone components (no NgModule needed)
- Angular 17+ compatible

## Installation

```bash
npm install @zenitnet/rich-text-editor
```

## Usage

### Editor Component

```typescript
import { RichTextEditorComponent } from '@zenitnet/rich-text-editor';

@Component({
  imports: [RichTextEditorComponent, ReactiveFormsModule],
  template: `
    <rte-editor
      [formControl]="myControl"
      placeholder="Start typing..."
      [maxLength]="5000"
    />
  `,
})
export class MyComponent {
  myControl = new FormControl('');
}
```

### Custom Toolbar

```typescript
import { RteToolbarConfig } from '@zenitnet/rich-text-editor';

// Only bold, italic, and links
const toolbar: RteToolbarConfig = {
  bold: true,
  italic: true,
  underline: false,
  link: true,
  orderedList: false,
  unorderedList: false,
  heading: false,
};
```

```html
<rte-editor [toolbar]="toolbar" [formControl]="myControl" />
```

### Safe HTML Pipe (for rendering)

```typescript
import { SafeHtmlPipe } from '@zenitnet/rich-text-editor';

@Component({
  imports: [SafeHtmlPipe],
  template: `<div [innerHTML]="content | safeHtml"></div>`,
})
export class DisplayComponent {
  content = '<p>Hello <strong>world</strong></p>';
}
```

## API

### `<rte-editor>`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `toolbar` | `RteToolbarConfig` | All enabled | Toolbar button visibility |
| `placeholder` | `string` | `''` | Placeholder text |
| `maxLength` | `number` | `0` (unlimited) | Character limit |

| Output | Type | Description |
|--------|------|-------------|
| `contentChanged` | `RteChangeEvent` | Emits `{ html, text }` on every change |

Implements `ControlValueAccessor` — works with `formControl`, `formControlName`, and `ngModel`.

### `SafeHtmlPipe`

Sanitizes HTML before rendering:
- Allows only safe tags: `p`, `br`, `b`, `i`, `u`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `h3`, `span`
- Strips `javascript:` URLs
- Adds `rel="noopener noreferrer"` to links
- Removes all event handlers and unsafe attributes

## Building

```bash
npm install
ng build
```

Output: `dist/rich-text-editor/`

## Publishing

```bash
cd dist/rich-text-editor
npm publish --access=public
```

## License

MIT
