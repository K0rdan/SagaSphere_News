let globals = {}, externals = [
  "colors",
  "mysql",
  "node-fetch",
  "xml2js"
];

for(let i in externals){
  globals[externals[i]] = externals[i];
}

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  external: externals,
  globals: globals
};