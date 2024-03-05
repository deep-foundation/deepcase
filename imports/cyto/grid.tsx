import { Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import GridLayout from "react-grid-layout";
import ReactResizeDetector from 'react-resize-detector';

export default function CytoGrid({
}: {}){
  const availableHandles = ["s", "w", "e", "n", "sw", "nw", "se", "ne"];

  const [layout, setLayout] = useState([
    { i: "a", x: 0, y: 0, w: 1, h: 2, static: true, isResizable: true, resizeHandles: availableHandles, },
    { i: "b", x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4, isResizable: true, resizeHandles: availableHandles, },
    { i: "c", x: 4, y: 0, w: 1, h: 2, isResizable: true, resizeHandles: availableHandles, }
  ]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const returning = (<>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', opacity: 0.5, pointerEvents: 'none' }}>
    <ReactResizeDetector handleWidth handleHeight onResize={(w, h) => setSize({ width: w, height: h })} />
      <GridLayout
        width={size.width}
        height={size.height}
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        verticalCompact={false}
        isResizable
        onLayoutChange={setLayout}
      >
        <Box 
          bg={'bgColor'}
          color={'text'}
          borderColor={'borderColor'}
          borderWidth='thin' borderRadius='lg'
          p={1} key="a" sx={{ pointerEvents: 'all' }}
        >a</Box>
        <Box 
          bg={'bgColor'}
          color={'text'}
          borderColor={'borderColor'}
          borderWidth='thin' borderRadius='lg'
          p={1} key="b" sx={{ pointerEvents: 'all' }}
        >b</Box>
        <Box 
          bg={'bgColor'}
          color={'text'}
          borderColor={'borderColor'}
          borderWidth='thin' borderRadius='lg'
          p={1} key="c" sx={{ pointerEvents: 'all' }}
        >c</Box>
      </GridLayout>
    </div>
  </>);

  return returning;
}
