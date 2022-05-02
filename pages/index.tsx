import React from "react";
import type { NextPage } from "next";

import Footer from "components/Organisms/Footer/Footer";
import Hero from "components/Molecules/Hero/Hero";

const Home: NextPage = () => {
  return (
    <React.Fragment>
      <Hero srcImage="/Images/hero.webp" />
      <Footer />
    </React.Fragment>
  );
};

export default Home;
