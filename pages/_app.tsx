import type { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";

import client from "config/ApolloGraphQL";

import NavigationBar from "components/Molecules/NavigationBar/NavigationBar";
// Future development -> import NavMenuAuth from "components/Molecules/NavigationMenu/NavMenuAuth/NavMenuAuth";

import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <NavigationBar pathnameTransparentMode={["/"]} />
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default MyApp;
