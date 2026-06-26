import { z } from "zod";
import { ConfigSchema } from "../src/config";

const schema = z.toJSONSchema(ConfigSchema, {
	target: "draft-7",
	unrepresentable: "any",
});

await Bun.write(
	"./schema/config.schema.json",
	`${JSON.stringify(schema, null, 2)}\n`,
);
console.log("Generated config.schema.json");
