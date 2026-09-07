# @fuzvolgyi/rich-text-editor

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
npm install @fuzvolgyi/rich-text-editor
```

## Usage

### Editor Component

```typescript
import { RichTextEditorComponent } from '@fuzvolgyi/rich-text-editor';

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
import { RteToolbarConfig } from '@fuzvolgyi/rich-text-editor';

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

Due to a known Angular limitation with pipes in libraries (see Known Issue below), define the `SafeHtmlPipe` locally in your project and use it alongside a `.rte-content` CSS class:

```typescript
@Component({
  template: `<div class="rte-content" [innerHTML]="content | safeHtml"></div>`,
})
export class DisplayComponent {
  content = '<p>Hello <strong>world</strong></p>';
}
```

### Required Global CSS for Rendered Content

Add this to your global `styles.scss` to properly display rich text content (lists, bold, links, etc.):

```scss
.rte-content {
  ul, ol {
    margin: 8px 0;
    padding-left: 24px;
    list-style-position: outside;
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  li {
    margin-bottom: 4px;
  }

  strong, b {
    font-weight: 700;
  }

  em, i {
    font-style: italic;
  }

  u {
    text-decoration: underline;
  }

  a {
    color: currentColor;
    text-decoration: underline;
  }

  h3 {
    font-size: 1.2em;
    font-weight: 600;
    margin: 12px 0 8px;
  }

  p {
    margin: 0 0 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
```

Without this, lists and other formatting won't display correctly on the rendered page.

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

## Known Issue: SafeHtmlPipe in Lazy-Loaded Contexts

The `SafeHtmlPipe` exported from this library uses Angular's dependency injection (`DomSanitizer`). Due to how Angular's partial compilation works for libraries, the pipe may fail with `NG0203: inject() must be called from an injection context` when used in lazy-loaded components.

**Workaround:** Define the `SafeHtmlPipe` locally in your consuming project instead of importing it from this library:

```typescript
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  private _sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }
    return this._sanitizer.bypassSecurityTrustHtml(value);
  }
}
```

Use the `RichTextEditorComponent` from the library normally — only the pipe has this limitation.

This is a known Angular issue with pipes that use DI in pre-compiled libraries consumed via partial compilation. It may be resolved in future Angular versions.

## Publishing

```bash
export GITHUB_TOKEN=ghp_your_token_here
bash publish.sh
```

The script builds the library and publishes to GitHub Packages (`npm.pkg.github.com`).

Requirements:
- GitHub PAT with `write:packages` scope (starts with `ghp_`)
- A GitHub repository named `rich-text-editor` under your account

## Installing in other projects

Add `.npmrc` to the consuming project root:

```
@fuzvolgyi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Then:

```bash
npm install @fuzvolgyi/rich-text-editor
```

## License

MIT
