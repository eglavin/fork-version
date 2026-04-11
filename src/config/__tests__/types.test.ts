import type z from "zod";
import type { ForkConfig } from "../types";
import type { ForkConfigJSONSchema } from "../schema";

describe("types", () => {
	it("zod json schema should match ForkConfig types", () => {
		type InferredSchema = z.infer<typeof ForkConfigJSONSchema>;

		expectTypeOf<InferredSchema>().toExtend<ForkConfig>();
	});
});
