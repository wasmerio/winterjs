import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from '@rollup/plugin-replace';
import terser from "@rollup/plugin-terser";

export default cliArgs => {
  return {
    input: "src/main.js", // the entry point of your application
    output: {
      file: "dist/bundle.js", // the output bundle
      format: "esm", // the output format
    },
    plugins: [
      resolve(), // resolves node modules
      commonjs(), // converts commonjs to es modules
      replace({
        preventAssignment: true,
        'process.env.TESTS_BACKEND_URL': cliArgs.local ? "'http://localhost:8081/'" : "'https://winter-tests.wasmer.app/'"
      }),
      terser(), // minifies the bundle
    ],
  };
};
