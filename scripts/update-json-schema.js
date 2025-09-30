#!/usr/bin/env node
// @ts-check

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import z from "zod";
import { ForkConfigSchema } from "../src/config/schema.js";
import { clickableLink } from "./utils/clickable-link.js";

const schemaLocation = join(import.meta.dirname, "..", "schema", `latest.json`);
const jsonSchema = z.toJSONSchema(ForkConfigSchema);

writeFileSync(
	schemaLocation,
	JSON.stringify(
		{
			...jsonSchema,
			required: [], // Make all properties optional
		},
		null,
		2,
	),
);

console.log(
	`Updated JSON schema: ${clickableLink(pathToFileURL(schemaLocation).href, schemaLocation)}`,
);
