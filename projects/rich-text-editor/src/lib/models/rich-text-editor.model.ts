export type RteToolbarConfig = {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	link?: boolean;
	orderedList?: boolean;
	unorderedList?: boolean;
	heading?: boolean;
};

export type RteChangeEvent = {
	html: string;
	text: string;
};

export const DEFAULT_TOOLBAR_CONFIG: RteToolbarConfig = {
	bold: true,
	italic: true,
	underline: true,
	link: true,
	orderedList: true,
	unorderedList: true,
	heading: false,
};
