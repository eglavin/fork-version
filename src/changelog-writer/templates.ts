import Handlebars from "handlebars";
import type { CommitGroup, NoteGroup } from "./types";

export interface ChangelogTemplateContext {
	version: string;
	/**
	 * Resolved compare url, or `undefined` when there's no previous tag, or it isn't fully resolved.
	 */
	compareUrl: string | undefined;
	/**
	 * An optional title for the release, rendered next to the version, e.g. `1.2.3 "Codename"`.
	 */
	title: string | undefined;
	date: string;
	noteGroups: NoteGroup[];
	commitGroups: CommitGroup[];
}

/**
 * The default markdown layout for a single changelog entry.
 */
export const CHANGELOG_ENTRY_TEMPLATE = `## {{#if compareUrl}}[{{version}}]({{compareUrl}}){{else}}{{version}}{{/if}}{{#if title}} "{{title}}"{{/if}} ({{date}})

{{#each noteGroups}}
### ⚠ {{title}}

{{#each notes}}
* {{#if scope}}**{{scope}}:** {{/if}}{{text}}
{{/each}}
{{/each}}
{{#each commitGroups}}

{{#if title}}
### {{title}}

{{/if}}
{{#each commits}}
* {{#if scope}}**{{scope}}:** {{/if}}{{displaySubject}}{{#if shortHash}}{{#if commitUrl}} ([{{shortHash}}]({{commitUrl}})){{else}} {{shortHash}}{{/if}}{{/if}}{{#if references.length}}, closes{{#each references}}{{#if url}} [{{label}}]({{url}}){{else}} {{label}}{{/if}}{{/each}}{{/if}}
{{/each}}
{{/each}}`;

/**
 * Compiles and renders `template` against `context`.
 *
 * Compiled with `noEscape: true` so markdown/HTML characters in commit subjects (e.g. `<`, `>`, `&`)
 * are emitted as-is, matching the plain string based renderer this replaces.
 *
 * @param template - Defaults to {@link CHANGELOG_ENTRY_TEMPLATE}. Exposed as a parameter so a future
 * user-supplied override can be threaded through without changing this function's shape.
 */
export function renderChangelogEntry(
	context: ChangelogTemplateContext,
	template: string = CHANGELOG_ENTRY_TEMPLATE,
): string {
	return Handlebars.compile<ChangelogTemplateContext>(template, { noEscape: true })(context);
}
