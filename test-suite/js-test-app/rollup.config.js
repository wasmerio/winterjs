import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/main.js", // the entry point of your application
  output: {
    file: "dist/bundle.js", // the output bundle
    format: "esm", // the output format
  },
  plugins: [
    resolve(), // resolves node modules
    commonjs(), // converts commonjs to es modules
    terser(), // minifies the bundle
  ],
};
