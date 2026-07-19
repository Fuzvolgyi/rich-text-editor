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
		const cleaned = this._sanitize(value);
		return this._sanitizer.bypassSecurityTrustHtml(cleaned);
	}

	private _sanitize(html: string): string {
		const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h3', 'span'];
		const allowedAttrs: Record<string, string[]> = {
			a: ['href', 'target', 'rel'],
			span: ['style'],
		};

		const div = document.createElement('div');
		div.innerHTML = html;

		this._walkNodes(div, allowedTags, allowedAttrs);

		return div.innerHTML;
	}

	private _walkNodes(parent: Element, allowedTags: string[], allowedAttrs: Record<string, string[]>): void {
		const children = Array.from(parent.childNodes);

		for (const child of children) {
			if (child.nodeType === Node.TEXT_NODE) {
				continue;
			}

			if (child.nodeType === Node.ELEMENT_NODE) {
				const el = child as Element;
				const tag = el.tagName.toLowerCase();

				if (!allowedTags.includes(tag)) {
					while (el.firstChild) {
						parent.insertBefore(el.firstChild, el);
					}
					parent.removeChild(el);
					continue;
				}

				const attrs = Array.from(el.attributes);
				const allowed = allowedAttrs[tag] || [];
				for (const attr of attrs) {
					if (!allowed.includes(attr.name)) {
						el.removeAttribute(attr.name);
					}
				}

				if (tag === 'a') {
					const href = el.getAttribute('href') || '';
					if (href.startsWith('javascript:')) {
						el.setAttribute('href', '#');
					}
					el.setAttribute('rel', 'noopener noreferrer');
				}

				this._walkNodes(el, allowedTags, allowedAttrs);
			} else {
				parent.removeChild(child);
			}
		}
	}
}
