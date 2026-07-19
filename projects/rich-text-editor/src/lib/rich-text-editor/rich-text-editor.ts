import {
	Component,
	ElementRef,
	forwardRef,
	input,
	output,
	signal,
	viewChild,
	AfterViewInit,
	OnDestroy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RteToolbarConfig, RteChangeEvent, DEFAULT_TOOLBAR_CONFIG } from '../models/rich-text-editor.model';

@Component({
	selector: 'rte-editor',
	standalone: true,
	templateUrl: './rich-text-editor.html',
	styleUrl: './rich-text-editor.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => RichTextEditorComponent),
			multi: true,
		},
	],
	host: {
		'[class.rte--disabled]': 'disabled()',
		'[class.rte--focused]': 'focused()',
	},
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
	toolbar = input<RteToolbarConfig>(DEFAULT_TOOLBAR_CONFIG);
	placeholder = input<string>('');
	maxLength = input<number>(0);

	contentChanged = output<RteChangeEvent>();

	protected editorRef = viewChild<ElementRef<HTMLDivElement>>('editor');
	protected focused = signal(false);
	protected disabled = signal(false);
	protected activeFormats = signal<Set<string>>(new Set());
	protected charCount = signal(0);

	private _onChange: (value: string) => void = () => {};
	private _onTouched: () => void = () => {};
	private _mutationObserver: MutationObserver | null = null;

	ngAfterViewInit(): void {
		const editor = this.editorRef()?.nativeElement;
		if (!editor) {
			return;
		}

		this._mutationObserver = new MutationObserver(() => this._emitChange());
		this._mutationObserver.observe(editor, {
			childList: true,
			subtree: true,
			characterData: true,
		});
	}

	ngOnDestroy(): void {
		this._mutationObserver?.disconnect();
	}

	writeValue(value: string): void {
		const editor = this.editorRef()?.nativeElement;
		if (editor) {
			editor.innerHTML = value || '';
			this._updateCharCount();
		}
	}

	registerOnChange(fn: (value: string) => void): void {
		this._onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this._onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled.set(isDisabled);
	}

	protected onFocus(): void {
		this.focused.set(true);
	}

	protected onBlur(): void {
		this.focused.set(false);
		this._onTouched();
	}

	protected onInput(): void {
		this._emitChange();
	}

	protected onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			return;
		}
	}

	protected onPaste(event: ClipboardEvent): void {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain') || '';
		const sanitized = this._sanitizePastedText(text);
		document.execCommand('insertHTML', false, sanitized);
	}

	protected execCommand(command: string, value?: string): void {
		if (this.disabled()) {
			return;
		}
		this._restoreFocus();
		document.execCommand(command, false, value);
		this._updateActiveFormats();
		this._emitChange();
	}

	protected onBold(): void {
		this.execCommand('bold');
	}

	protected onItalic(): void {
		this.execCommand('italic');
	}

	protected onUnderline(): void {
		this.execCommand('underline');
	}

	protected onOrderedList(): void {
		this.execCommand('insertOrderedList');
	}

	protected onUnorderedList(): void {
		this.execCommand('insertUnorderedList');
	}

	protected onHeading(): void {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const parentEl = selection.anchorNode?.parentElement;
		if (parentEl?.tagName === 'H3') {
			this.execCommand('formatBlock', 'p');
		} else {
			this.execCommand('formatBlock', 'h3');
		}
	}

	protected onLink(): void {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const parentLink = this._getParentTag(selection.anchorNode, 'A');
		if (parentLink) {
			this.execCommand('unlink');
			return;
		}

		const url = prompt('Enter URL:');
		if (url) {
			this.execCommand('createLink', url);
			const newSelection = window.getSelection();
			if (newSelection && newSelection.rangeCount > 0) {
				const anchor = this._getParentTag(newSelection.anchorNode, 'A') as HTMLAnchorElement;
				if (anchor) {
					anchor.target = '_blank';
					anchor.rel = 'noopener noreferrer';
				}
			}
		}
	}

	protected isActive(format: string): boolean {
		return this.activeFormats().has(format);
	}

	protected onSelectionChange(): void {
		this._updateActiveFormats();
	}

	private _emitChange(): void {
		const editor = this.editorRef()?.nativeElement;
		if (!editor) {
			return;
		}

		const html = this._cleanHtml(editor.innerHTML);
		const text = editor.textContent || '';

		this._updateCharCount();
		this._onChange(html);
		this.contentChanged.emit({ html, text });
	}

	private _updateCharCount(): void {
		const editor = this.editorRef()?.nativeElement;
		if (editor) {
			this.charCount.set(editor.textContent?.length || 0);
		}
	}

	private _updateActiveFormats(): void {
		const formats = new Set<string>();
		if (document.queryCommandState('bold')) formats.add('bold');
		if (document.queryCommandState('italic')) formats.add('italic');
		if (document.queryCommandState('underline')) formats.add('underline');
		if (document.queryCommandState('insertOrderedList')) formats.add('orderedList');
		if (document.queryCommandState('insertUnorderedList')) formats.add('unorderedList');

		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			if (this._getParentTag(selection.anchorNode, 'A')) formats.add('link');
			if (this._getParentTag(selection.anchorNode, 'H3')) formats.add('heading');
		}

		this.activeFormats.set(formats);
	}

	private _restoreFocus(): void {
		const editor = this.editorRef()?.nativeElement;
		if (editor && !editor.contains(document.activeElement)) {
			editor.focus();
		}
	}

	private _getParentTag(node: Node | null, tag: string): HTMLElement | null {
		let current = node;
		while (current && current !== this.editorRef()?.nativeElement) {
			if (current instanceof HTMLElement && current.tagName === tag) {
				return current;
			}
			current = current.parentNode;
		}
		return null;
	}

	private _sanitizePastedText(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\n\n/g, '</p><p>')
			.replace(/\n/g, '<br>');
	}

	private _cleanHtml(html: string): string {
		if (html === '<br>' || html === '<div><br></div>') {
			return '';
		}
		return html
			.replace(/<div>/gi, '<p>')
			.replace(/<\/div>/gi, '</p>')
			.replace(/<p><br><\/p>/gi, '')
			.trim();
	}
}
