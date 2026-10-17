import type z from "zod";

import type { ForkConfigJSONSchema } from "../schema";
import type { ForkConfig } from "../types";

describe("types", () => {
	it("zod json schema should match ForkConfig types", () => {
		type InferredSchema = z.infer<typeof ForkConfigJSONSchema>;

		expectTypeOf<InferredSchema>().toExtend<ForkConfig>();
	});
});
