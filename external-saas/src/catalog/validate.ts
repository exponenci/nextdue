import { loadCatalogPack } from "./load";
import { loadRuntimeRegistry } from "./registry";

for (const country of ["ru", "uz"] as const) {
  const pack = await loadCatalogPack(country);
  console.log(`${pack.countryCode} ${pack.version}: ${pack.status}, ${pack.items.length} items`);
}

const registry = await loadRuntimeRegistry();
console.log(`${registry.counts.countries} countries, ${registry.counts.rules} rules, ${registry.counts.sources} sources`);
