import React from "react";
import styled from "@emotion/styled";

import {
  ButtonDarkPills,
  ButtonTransparent,
} from "components/Atoms/General.css";

const NavMenuAuth = () => {
  return (
    <NavMenuAuthBase>
      <ButtonTransparent className="mr-7" color="#f7f7f7">
        Log in
      </ButtonTransparent>
      <ButtonDarkPills>Sign Up</ButtonDarkPills>
    </NavMenuAuthBase>
  );
};

const NavMenuAuthBase = styled.nav`
  & > button {
    text-transform: uppercase;
  }
`;

export default NavMenuAuth;
