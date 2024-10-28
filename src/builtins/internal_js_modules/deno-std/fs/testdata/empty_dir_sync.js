import { emptyDirSync } from "../empty_dir";
try {
  emptyDirSync(Deno.args[0]);
  Deno.stdout.write(new TextEncoder().encode("success"));
} catch (err) {
  Deno.stdout.write(
    new TextEncoder().encode(
      err instanceof Error ? err.message : "[non-error thrown]"
    )
  );
}
