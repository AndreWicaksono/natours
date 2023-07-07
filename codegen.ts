import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://127.0.0.1:1337/graphql",
  documents: ["gql/**/*.graphql"],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    "./gql/": {
      preset: "client",
    },
  },
};

export default config;
