module.exports = {
  client: {
    includes: ["graphql/**"],
    localSchemaFile: "./schema.json",
    service: {
      name: "natours",
      url: process.env.NEXT_PUBLIC_GRAPHQL,
    },
  },
};
