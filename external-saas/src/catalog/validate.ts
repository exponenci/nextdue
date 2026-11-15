import { loadCatalogPack } from "./load";

for (const country of ["ru", "uz"] as const) {
  const pack = await loadCatalogPack(country);
  console.log(`${pack.countryCode} ${pack.version}: ${pack.status}, ${pack.items.length} items`);
}
