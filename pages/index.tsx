import React from "react";
import type { NextPage } from "next";

import Footer from "components/Organisms/Footer/Footer";
import Hero from "components/Molecules/Hero/Hero";
import SectionTourPreview from "components/Organisms/Section/Home/SectionTourPreview";

const Home: NextPage = () => {
  return (
    <React.Fragment>
      <Hero className="mb-6 lg:mb-8" srcImage="/Images/hero.webp" />
      <SectionTourPreview className="pb-6" />
      <Footer />
    </React.Fragment>
  );
};

export default Home;
