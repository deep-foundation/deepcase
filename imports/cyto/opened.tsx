import { useDeep, useDeepId } from "@deep-foundation/deeplinks/imports/client";
import { useRefAutofill, useSpaceId } from "../hooks";
import { useMemo } from "react";
import { Id } from "@deep-foundation/deeplinks/imports/minilinks";

export function useOpenedMethods(): {
  open: (id: Id, handlerId: Id) => void;
  close: (id: Id) => void;
  isOpened: (id: Id) => boolean;
} {
  const [spaceId] = useSpaceId();
  const spaceIdRef = useRefAutofill(spaceId);
  const deep = useDeep();
  return useMemo(() => {
    let Opened, OpenedHandler;
    (async () => {
      Opened = await deep.id('@deep-foundation/deepcase-opened', 'Opened');
      OpenedHandler = await deep.id('@deep-foundation/deepcase-opened', 'OpenedHandler');
    })();
    return {
      isOpened: (id) => {
        const q = deep.minilinks.query({
          type_id: OpenedHandler,
          from: {
            type_id: Opened,
            from_id: spaceIdRef.current,
            to_id: id,
          },
        });
        const openedHandler = q?.[0];
        return !!openedHandler
      },
      close: async (id) => {
        console.log('close', { spaceId, id });
        const whereF = { type_id: Opened, from_id: spaceIdRef.current, to_id: id };
        const whereFH = { type_id: OpenedHandler, from: whereF };
        const where = {
          _or: [
            whereF,
            { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: spaceIdRef.current, to: whereF },
            whereFH,
            { type_id: deep.idLocal('@deep-foundation/core', 'Contain'), from_id: spaceIdRef.current, to: whereFH },
          ],
        };
        console.log('closeed', await deep.delete(where));
      },
      open: async (id, handlerId) => {
        console.log('open', { spaceId, id, handlerId });
        const q = await deep.select({
          type_id: OpenedHandler,
          from: {
            type_id: Opened,
            from_id: spaceIdRef.current,
            to_id: id,
          },
        });
        const openedHandler = q?.data?.[0];
        let openedHandlerId = openedHandler?.id;
        if (!openedHandlerId) {
          const { data: [{ id: newOpenId }] } = await deep.insert({
            type_id: Opened,
            from_id: spaceIdRef.current,
            to_id: id,
            out: { data: {
              type_id: OpenedHandler,
              to_id: handlerId,
              in: { data: {
                type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
                from_id: spaceIdRef.current
              } },
            } },
            in: { data: {
              type_id: deep.idLocal('@deep-foundation/core', 'Contain'),
              from_id: spaceIdRef.current
            } },
          });
          openedHandlerId = newOpenId;
        } else {
          await deep.update({
            id: openedHandlerId,
          }, {
            to_id: handlerId,
          });
        }
        console.log('opened', { spaceIdRefCurrent: spaceIdRef.current, id, handlerId, openedHandlerId: openedHandlerId });
      }
    };
  }, []);
};
