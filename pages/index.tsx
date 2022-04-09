import React from "react";
import type { NextPage } from "next";

import Hero from "components/Molecules/Hero/Hero";

const Home: NextPage = () => {
  return (
    <React.Fragment>
      <Hero srcImage="/Images/hero.webp" />
    </React.Fragment>
  );
};

export default Home;
