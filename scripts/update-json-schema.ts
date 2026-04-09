#!/usr/bin/env node

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import z from "zod";
import { ForkConfigSchema } from "../src/config/schema.ts";
import { clickableLink } from "./utils/clickable-link.ts";

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
