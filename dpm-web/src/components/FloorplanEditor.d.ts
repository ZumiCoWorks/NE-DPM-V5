declare module '*/FloorplanEditor' {
  import React from 'react';
  
  interface FloorplanEditorProps {
    initialFloorplan?: string | null;
    initialEventId?: string | null;
  }
  
  const FloorplanEditor: React.FC<FloorplanEditorProps>;
  export default FloorplanEditor;
}
