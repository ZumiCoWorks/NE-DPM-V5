declare module '*/FloorplanEditor' {
  import React from 'react';

  interface FloorplanEditorProps {
    initialFloorplan?: string | null;
    initialEventId?: string | null;
    onEventChange?: (eventId: string | null) => void;
    hideToolbar?: boolean;
  }

  const FloorplanEditor: React.FC<FloorplanEditorProps>;
  export default FloorplanEditor;
}
