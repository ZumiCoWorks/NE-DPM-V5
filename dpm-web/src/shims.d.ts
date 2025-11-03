// Basic shims to quiet missing type definitions during local editing/dev when @types aren't installed.
// These are intentionally very permissive (any). Replace with proper types when @types packages are available.

declare module 'react' {
  const React: any
  export default React
}

declare module 'react/jsx-runtime' {
  const jsx: any
  export default jsx
}

declare module 'react-router-dom' {
  const anyExport: any
  export = anyExport
}

declare module 'lucide-react' {
  const anyExport: any
  export = anyExport
}

declare module '@supabase/supabase-js' {
  const anyExport: any
  export = anyExport
}
