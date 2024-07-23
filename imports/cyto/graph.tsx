import cytoscape from 'cytoscape';
import edgeConnections from 'cytoscape-edge-connections';
import { useRef, useState } from 'react';
// import CytoscapeComponent from 'react-cytoscapejs';
// import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
// import elk from 'cytoscape-elk';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import cola from 'cytoscape-cola';
// import COSEBilkent from 'cytoscape-cose-bilkent';
import d3Force from 'cytoscape-d3-force';
import deepd3Force from 'cytoscape-deep-d3-force';
// import fcose from 'cytoscape-fcose';
// import euler from 'cytoscape-euler';
// import elk from 'cytoscape-elk';
// import cxtmenu from 'cytoscape-cxtmenu';
import cxtmenu from './cxtmenu';
// import cxtmenu from '@lsvih/cytoscape-cxtmenu/src/index';
import edgehandles from 'cytoscape-edgehandles';
// import cytoscapeLasso from 'cytoscape-lasso';
import { Text, useToast } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useContainer, useCytoViewport, useFocusMethods, useInsertingCytoStore, useLayout, useRefAutofill, useShowExtra, useShowTypes, useSpaceId, useLayoutAnimation } from '../hooks';
import { Refstater, useRefstarter } from '../refstater';
import { CytoDropZone } from './drop-zone';
import { CytoEditor } from './editor';
import { useCytoElements } from './elements';
import { CytoReactLayout } from './react';
import { useCytoStylesheets } from './stylesheets';
import { CytoGraphProps } from './types';

import { useCyInitializer, useCytoEditor } from './hooks';
import { CytoHandlers, useCytoHandlers, useCytoHandlersApply } from '../cyto-handler';
import CytoGrid from './grid';

const CytoscapeComponent = dynamic<any>(
  () => import('deep.react-cytoscapejs').then((m) => m.default),
  { ssr: false }
);

cytoscape.use(dagre);
cytoscape.use(cola);
// cytoscape.use(COSEBilkent);
// cytoscape.use(klay);
// cytoscape.use(elk);
// cytoscape.use(euler);
cytoscape.use(d3Force);
cytoscape.use(deepd3Force);
// cytoscape.use(fcose);
cytoscape.use(cxtmenu);
cytoscape.use(edgeConnections);
cytoscape.use(edgehandles);

export function useCytoFocusMethods(cy) {
  const { focus, unfocus } = useFocusMethods();
  const lockingRef = useRef<any>({});
  return {
    lockingRef,
    focus: async (elOrEl, position) => {
      if (typeof(elOrEl) === 'number') {
        return await focus(elOrEl, position);
      } else {
        const el = elOrEl;
        const id = el?.data('link')?.id;
        const locking = lockingRef.current;
        if (id) {
          // locking[id] = true;
          // el.lock();
          const focused = await focus(id, position);
          return focused;
        }
      }
    },
    unfocus: async (elOrEl) => {
      if (typeof(elOrEl) === 'number') {
        return await unfocus(elOrEl);
      } else {
        const el = elOrEl;
        const locking = lockingRef.current;
        const id = el?.data('link')?.id;
        if (id) {
          // el.unlock();
          // locking[id] = false;
          const focused = await unfocus(id);
          return focused;
        }
      }
    }
  };
}

export default function CytoGraph({
  links = [],
  cytoViewportRef: _cytoViewportRef,
  cyRef,
  gqlPath: _gqlPath,
  gqlSsl: _gqlSsl,
  children = null,
  useCytoViewport: _useCytoViewport = useState,
  useSpaceId: _useSpaceId = useSpaceId,
}: CytoGraphProps){
  // console.log('https://github.com/deep-foundation/deepcase-app/issues/236', 'CytoGraph', 'links', links);
  const deep = useDeep();
  const __cytoViewportRef = useRefstarter<{ pan: { x: number; y: number; }; zoom: number }>();
  const cytoViewportRef = _cytoViewportRef || __cytoViewportRef;

  const gqlPath = _gqlPath || deep?.client?.path;
  const gqlSsl = _gqlSsl || deep?.client?.ssl;

  // console.time('CytoGraph');
  const [spaceId, setSpaceId] = _useSpaceId();
  const [container, setContainer] = useContainer();
  const [extra, setExtra] = useShowExtra();
  const [showTypes, setShowTypes] = useShowTypes();
  const [insertingCyto, setInsertingCyto] = useInsertingCytoStore();
  const insertingCytoRef = useRefAutofill(insertingCyto);
  const toast = useToast();

  const [cy, setCy] = useState<any>();
  cyRef.current = cy;
  const ehRef = useRef<any>();
  const rootRef = useRef();

  const cyh = useCytoHandlers();
  const { cytoHandlersRef, iterator, onChange } = cyh;

  const stylesheets = useCytoStylesheets();

  const { elementsById, elements, reactElements, cytoHandled } = useCytoElements(deep.minilinks, links, cy, spaceId, cyh);
  const elementsRef = useRefAutofill(elements);

  const newStylesheets = [];
  useCytoHandlersApply(cyh, elements, newStylesheets, iterator);
  const resultStylesheets = [ ...stylesheets, ...newStylesheets ];

  const { onLoaded } = useCyInitializer({
    elementsRef, elements, reactElements, cyRef, setCy, ehRef, cytoViewportRef,
    rootRef, useSpaceId: _useSpaceId
  });

  const { layout, setLayout } = useLayout();
  const [ layoutAnimation ] = useLayoutAnimation();

  const returning = (<>
    <CytoHandlers handled={cytoHandled} elementsById={elementsById} onChange={onChange}/>
    <Refstater useHook={_useCytoViewport as any} stateRef={cytoViewportRef}/>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} ref={rootRef}>
      <CytoDropZone
        cy={cy}
        gqlPath={gqlPath}
        gqlSsl={gqlSsl}>
        {<CytoscapeComponent
          cy={(_cy) => {
            if (!cy) onLoaded(_cy);
          }}
          elements={elements}
          layout={layout({elementsRef: elementsRef.current, cy, isAnimate: layoutAnimation, deep})}
          stylesheet={resultStylesheets}
          panningEnabled={true}
          pan={cytoViewportRef?.current?.value?.pan}
          zoom={cytoViewportRef?.current?.value?.zoom}
          style={ { width: '100%', height: '100%' } }
        />}
        {!!cy && <CytoReactLayout
          cy={cy}
          elements={reactElements}
          spaceId={spaceId}
        />}
        {false && !!cy && <CytoGrid/>}
        {children}
      </CytoDropZone>
    </div>
  </>);

  // console.timeEnd('CytoGraph');

  return returning;
}
