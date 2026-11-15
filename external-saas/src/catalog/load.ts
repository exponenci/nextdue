import { readFile } from "node:fs/promises";
import path from "node:path";
import { catalogPackSchema, type CatalogPack } from "./schema";

export async function loadCatalogPack(country: "ru" | "uz"): Promise<CatalogPack> {
  const file = path.join(process.cwd(), "catalog", country, "pack.json");
  const contents = await readFile(file, "utf8");
  return catalogPackSchema.parse(JSON.parse(contents));
}
