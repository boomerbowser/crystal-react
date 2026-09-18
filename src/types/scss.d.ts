/* SCSS modules resolve to a map of local name to generated class. */
declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
