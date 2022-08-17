import { css, SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";

const GridPhotoGalleryBase = styled.div<{}>`
  position: relative;

  height: calc(50vw - 32px);

  @media only screen and (min-width: 1208px) {
    height: 604px; // 604px = 50% of maximum container width: 1208px
  }
`;

export const ButtonViewGalleryFloat = styled.div`
  position: absolute;
  right: 24px;
  bottom: 24px;
`;
export const ButtonViewPhotos = styled.button<{
  css?: string | SerializedStyles;
}>`
  ${(props) => {
    if (props.css) return props.css;

    return css`
      display: flex;
      align-items: center;
      background-color: #fff;
      box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.2);
      color: #222;
      font-size: 12px;
      font-weight: 400;
      padding: 4px 12px;

      span {
        display: inline-block;
      }
    `;
  }}
`;

export const PhotoGridTwoSquares = styled.div<{
  hasChildrenGrid?: boolean;
}>`
  display: grid;
  grid-column-gap: 8px;
  grid-template-columns: calc(50vw - 32px) 1fr;
  grid-template-rows: calc(50vw - 32px);

  @media only screen and (min-width: 1208px) {
    grid-template-columns: 604px 1fr; // 604px = 50% of maximum container width: 1208px
    grid-template-rows: 604px; // 604px = 50% of maximum container width: 1208px
  }

  ${({ hasChildrenGrid }) => {
    if (hasChildrenGrid) {
      return css`
        & > * {
          &:nth-of-type(1) {
            img {
              border-top-left-radius: 4px;
              border-bottom-left-radius: 4px;
            }
          }
        }
      `;
    }

    return css`
      & > * {
        &:nth-of-type(1) {
          img {
            border-top-left-radius: 4px;
            border-bottom-left-radius: 4px;
          }
        }

        &:nth-of-type(2) {
          img {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
          }
        }
      }
    `;
  }}
`;

export const PhotoGridThreeSquares = styled.div`
  height: 100%;

  display: grid;
  grid-gap: 8px;
  grid-template-areas:
    "first second"
    "first third";
  grid-template-columns: 1.5fr 1fr;
  grid-template-rows: repeat(2, 1fr);

  & > * {
    &:nth-of-type(1) {
      grid-area: first;

      img {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }
    }
    &:nth-of-type(2) {
      grid-area: second;

      img {
        border-top-right-radius: 4px;
      }
    }
    &:nth-of-type(3) {
      grid-area: third;

      img {
        border-bottom-right-radius: 4px;
      }
    }
  }
`;

export const PhotoGridFourSquares = styled.div<{ rootContainer?: boolean }>`
  height: 100%;

  display: grid;
  grid-gap: 8px;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);

  ${({ rootContainer = false }) => {
    if (rootContainer) {
      return css`
        & > * {
          &:nth-of-type(1) {
            img {
              border-top-left-radius: 4px;
            }
          }

          &:nth-of-type(2) {
            img {
              border-top-right-radius: 4px;
            }
          }

          &:nth-of-type(3) {
            img {
              border-bottom-left-radius: 4px;
            }
          }
          &:nth-of-type(4) {
            img {
              border-bottom-right-radius: 4px;
            }
          }
        }
      `;
    }

    return css`
      & > * {
        &:nth-of-type(2) {
          img {
            border-top-right-radius: 4px;
          }
        }

        &:nth-of-type(4) {
          img {
            border-bottom-right-radius: 4px;
          }
        }
      }
    `;
  }}
`;

export default GridPhotoGalleryBase;
