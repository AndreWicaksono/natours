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
        'xl': "1208px",
        '2xl': "1280px"
      }
    },
    extend: {},
  },
  plugins: [],
};
