import styled from "@emotion/styled";

export const NavigationBarBaseTransparent = styled.div`
  position: fixed;
  top: 0;
  z-index: 30;

  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 80px;
  width: 100vw;

  max-width: 100%;

  background-color: transparent;
`;

export const NavigationBarBaseSolid = styled.div`
  position: fixed;
  top: 0;
  z-index: 30;

  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 80px;
  width: 100vw;

  max-width: 100%;

  background-color: #444;
`;
