// Fallback wrapper: require the JSX implementation at runtime.
// Using require avoids creating an import alias that can trigger circular-alias
// diagnostics in the TypeScript compiler.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const maybe = require('./FloorplanCanvas.jsx');
const FloorplanCanvasImpl = maybe?.default ?? maybe;

export default FloorplanCanvasImpl;
export const FloorplanCanvas = FloorplanCanvasImpl;
