import { css } from "@emotion/react";
import styled from "@emotion/styled";

export const ButtonDarkPills = styled.button<{
  backgroundColor?: string;
  color?: string;
}>`
  border: 1px solid rgb(247, 247, 247);
  border-radius: 6rem;
  padding: 0.5rem 2rem;
  transition: all 0.2s;

  ${({ backgroundColor = "#444", color = "#f7f7f7" }) => {
    return css`
      background-color: ${backgroundColor};
      color: ${color};
    `;
  }}

  &:active, &:hover {
    transform: translateY(-2px);
    text-shadow: 0 0.7rem 1rem black;
  }

  &:hover {
    background-color: #f7f7f7;
    color: #777;
    text-shadow: none;
  }
`;

export const ButtonTransparent = styled.button<{ color?: string }>`
  ${({ color }) => {
    return css`
      color: ${color};
    `;
  }}

  transition: all 0.2s;

  &:active,
  &:hover {
    transform: translateY(-2px);
    text-shadow: 0 0.7rem 1rem black;
  }
`;
