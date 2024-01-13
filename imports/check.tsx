import Debug from 'debug';
import { gql } from '@apollo/client';
import forEach from 'lodash/forEach';
import { Id } from '@deep-foundation/deeplinks/imports/minilinks';

interface Node {
  from_id?: Id; id?: Id; to_id?: Id; type_id?: Id;
  in: Node[]; out: Node[];
}

interface Marker {
  id: Id; item_id: Id; path_item_depth: Id; path_item_id: Id; root_id: Id; position_id: string;
  by_position: Marker[];
}

export const check = async (hash: { [name:string]: Id }, client) => {
  const fetch = async () => {
    const result = await client.query({ query: gql`query FETCH_FOR_CHECK {
      mp: mp { id item_id path_item_depth path_item_id root_id position_id by_position(order_by: { path_item_depth: asc }) { id item_id path_item_depth path_item_id root_id position_id } }
      nodes: links { from_id id to_id type_id in { from_id id to_id type_id } out { from_id id to_id type_id } }
    }` });
    return { nodes: result?.data?.nodes || [], mp: result?.data?.mp || [] };
  };

  const { nodes, mp } = await fetch();

  let valid = true;
  const invalid = (...args) => {
    valid = false;
    console.log(...args);
  };
  const nodesChecked: { [id: Id]: boolean; } = {};
  const markersChecked: { [id: Id]: boolean; } = {};
  const checkNode = (node: Node) => {
    if (nodesChecked[node.id]) return;
    else nodesChecked[node.id] = true;

    const isLink = !!(node?.from_id && node?.to_id);
    const isRoot = isLink ? false : !node?.in?.length;

    const markers = mp.filter((m) => m.item_id === node.id);
    const positions = mp.filter((m) => m.item_id === node.id && m.path_item_id === node.id);

    console.log(
      `check #${node.id} ${isLink ? 'link' : 'node'} in${node?.in?.length} out${node?.out?.length}`,
      positions.map((pos) => {
        return `${pos.root_id} [${pos.by_position.map((m) => `${m.path_item_id}`).join(',')}]`;
      }),
    );

    if (isRoot) {
      if (markers.length !== 1) invalid(`invalid node #${node.id} root but markers.length = ${markers.length}`);
    }

    if (!markers.length) invalid(`invalid node #${node.id} markers lost, markers.length = ${markers.length}`);

    positions.forEach((position) => {
      checkPosition(position);
    });
  };
  const checkPosition = (position: Marker) => {
    position.by_position.forEach((marker, i) => {
      markersChecked[marker.id] = true;
      if (marker.position_id != position.position_id) invalid(`invalid position ${position.root_id} [${position.by_position.map((m) => m.path_item_id).join(',')}] position_id not equal`);
      const node = nodes.find((n) => n.id === marker.path_item_id);
      if (!node) invalid(`invalid position ${position.root_id} [${position.by_position.map((m) => m.path_item_id).join(',')}] node lost #${marker.path_item_id}`);
    });
  };
  nodes.forEach((node) => {
    checkNode(node);
  });
  mp.forEach((marker) => {
    if (!markersChecked[marker.id]) invalid(`invalid marker #${marker.id} of node #${marker.item_id} ${marker.root_id}[...${marker.path_item_id}...]`);
  });
  if (!valid) throw new Error('invalid');
};