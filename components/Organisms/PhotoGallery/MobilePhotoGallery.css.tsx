import { css } from "@emotion/react";
import styled from "@emotion/styled";

export const StylesButtonModalTriggerTransparent = css`
  width: 100%;

  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;

  opacity: 0;
`;

const MobilePhotoGalleryBase = styled.div`
  position: relative;

  .swiper {
    height: calc(((100vw) / 16) * 9);
    width: 100%;
  }

  .swiper-slide {
    text-align: center;
    font-size: 18px;
    background: #fff;

    /* Center slide text vertically */
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    -webkit-align-items: center;
    align-items: center;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`;

export default MobilePhotoGalleryBase;
