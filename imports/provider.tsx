import { TokenProvider, useTokenController } from '@deep-foundation/deeplinks/imports/react-token';
import { ApolloClientTokenizedProvider } from '@deep-foundation/react-hasura/apollo-client-tokenized-provider';
import { LocalStoreProvider } from '@deep-foundation/store/local';
import { QueryStoreProvider } from '@deep-foundation/store/query';
import { CookiesStoreProvider } from '@deep-foundation/store/cookies';

import { ChakraProvider } from '@chakra-ui/react';
import themeChakra from './theme/theme';
import { useEffect, useMemo } from 'react';
import Debug from 'debug';

export function ProviderConnected({
  children,
}: {
  children: JSX.Element;
}) {
  const [token, setToken] = useTokenController();

  return <>{children}</>;
}

export function StaticProviders({
  children,
}: {
  children: JSX.Element;
}) {
  return <>
    <QueryStoreProvider>
      <CookiesStoreProvider>
        <LocalStoreProvider>
          <TokenProvider>
            {children}
          </TokenProvider>
        </LocalStoreProvider>
      </CookiesStoreProvider>
    </QueryStoreProvider>
  </>;
}

export function Provider({
  gqlPath,
  gqlSsl,
  children,
}: {
  gqlPath?: string;
  gqlSsl?: boolean;
  children: JSX.Element;
}) {
  const ThemeProviderCustom = ChakraProvider;
  const themeCustom = themeChakra;

  return (<>
    <ThemeProviderCustom theme={themeCustom}>
      <ApolloClientTokenizedProvider options={useMemo(() => ({
        client: 'deeplinks-app', path: gqlPath, ssl: gqlSsl, ws: !!(process as any)?.browser,
        fetchPolicy: 'no-cache',
        query: {
          fetchPolicy: 'no-cache',
        },
        watchQuery: {
          fetchPolicy: 'no-cache',
        },
        }), [gqlPath, gqlSsl])}>
        <ProviderConnected>
          {children}
        </ProviderConnected>
      </ApolloClientTokenizedProvider>
    </ThemeProviderCustom>
  </>)
};
