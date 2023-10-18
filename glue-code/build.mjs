import * as esbuild from "esbuild";

const ctx = await esbuild.context({
    entryPoints: ["src/index.ts"],
    bundle: true,
    banner: {
        js: "// AUTOMATICALLY GENERATED. DO NOT EDIT.",
    },
    outfile: "dist/index.js",
});

await ctx.watch();
console.log("ESBuild watching...");
