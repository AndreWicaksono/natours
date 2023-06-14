import styled from "@emotion/styled";

export const NavigationBarBaseTransparent = styled.div`
  position: fixed;
  top: 0;
  z-index: 30;

  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 60px;
  width: 100vw;

  max-width: 100%;

  background-color: transparent;

  @media only screen and (min-width: 1024px) {
    height: 70px;
  }
`;

export const NavigationBarBaseSolid = styled.div`
  position: fixed;
  top: 0;
  z-index: 30;

  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 60px;
  width: 100vw;

  max-width: 100%;

  background-image: linear-gradient(
    to bottom right,
    rgba(125, 213, 111, 0.85),
    rgba(40, 180, 135, 0.85)
  );

  @media only screen and (min-width: 1024px) {
    height: 70px;
  }
`;
