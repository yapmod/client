/*
 * `babel-preset-solid` and `@babel/preset-typescript` ship no declarations.
 * Both are plain preset factories, which is the whole contract the builder
 * relies on: Babel accepts the factory (and unwraps `__esModule` defaults
 * itself), and `PluginTarget` types any function as a preset.
 */
declare module 'babel-preset-solid' {
  const preset: (
    api: unknown,
    options?: Record<string, unknown>,
  ) => {
    plugins: unknown[];
  };
  export default preset;
}

declare module '@babel/preset-typescript' {
  const preset: (
    api: unknown,
    options?: Record<string, unknown>,
  ) => {
    plugins: unknown[];
  };
  export default preset;
}
