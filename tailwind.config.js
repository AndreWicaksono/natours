module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  important: true,
  theme: {
    container: {
      padding: {
        DEFAULT: "1rem",
      },
      screens: {
        xl: "1208px",
        "2xl": "1280px",
      },
    },
    extend: {
      backgroundImage: {
        "gradient-natours":
          "linear-gradient( to bottom right, rgba(125, 213, 111, 0.85), rgba(40, 180, 135, 0.85) )",
      },
      colors: {
        "natours-green-primary": "#55c57a",
      },
    },
  },
  plugins: [],
};
