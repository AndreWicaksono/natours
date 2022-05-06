import { ApolloClient, InMemoryCache } from "@apollo/client";

const isBrowser = typeof window !== "undefined";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  ssrMode: isBrowser,  
  uri: process.env.NEXT_PUBLIC_GRAPHQL,
});

export default client;
