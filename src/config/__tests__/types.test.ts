import type z from "zod";
import type { ForkConfig } from "../types";
import type { ForkConfigSchema } from "../schema";

describe("types", () => {
	it("zod schema should match ForkConfig types", () => {
		type InferredSchema = z.infer<typeof ForkConfigSchema>;

		expectTypeOf<InferredSchema>().toExtend<ForkConfig>();
	});
});
