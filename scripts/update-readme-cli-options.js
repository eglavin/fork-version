#!/usr/bin/env node
// @ts-check

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { helperText } from "../src/config/cli-arguments.js";
import { clickableLink } from "./utils/clickable-link.js";

const readmeLocation = join(import.meta.dirname, "..", "README.md");
const readmeContent = readFileSync(readmeLocation, "utf-8");

const startMarker = "<!-- START COMMAND LINE OPTIONS -->";
const endMarker = "<!-- END COMMAND LINE OPTIONS -->";

writeFileSync(
	readmeLocation,
	readmeContent.replace(
		new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
		`${startMarker}

\`\`\`text
${helperText}
\`\`\`

${endMarker}`,
	),
);

console.log(`Updated README: ${clickableLink(pathToFileURL(readmeLocation).href, readmeLocation)}`);
