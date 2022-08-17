import styled from "@emotion/styled";

const CarouselSimpleGalleryBase = styled.div`
  position: relative;
  width: 100%;

  @media only screen and (min-width: 768px) {
    max-width: calc(100% - (112px + 48px));

    margin: 0 auto;
  }

  .swiper {
    height: calc((100vw / 16) * 9);
    width: 100%;

    position: unset;

    @media only screen and (min-width: 768px) {
      height: calc(((100vw - (112px + 48px)) / 16) * 9); // 365.62500;
    }

    @media only screen and (min-width: 1208px) {
      height: calc(((1208px - (112px + 48px)) / 16) * 9); // 365.62500;
    }

    &-button {
      &-next,
      &-prev {
        height: calc(var(--swiper-navigation-size) / 44 * 44);
        width: calc(var(--swiper-navigation-size) / 44 * 44);

        border: 1px solid #fff;
        border-radius: 50%;

        &:after {
          color: #fff;
          font-size: 12px;
        }

        &:hover {
          background: rgb(74, 74, 74) none repeat scroll 0% 0%;
        }
      }

      &-next {
        right: -60px;
      }

      &-prev {
        left: -60px;
      }
    }
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
  }

  .swiper-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  body {
    background: #000;
    color: #000;
  }

  /* .swiper {
    width: 100%;
    height: 300px;
    margin-left: auto;
    margin-right: auto;
  } */

  .swiper-slide {
    background-size: cover;
    background-position: center;
  }

  /* .mySwiper2 {
    height: 80%;
    width: 100%;
  } */

  .mySwiper {
    height: 20%;
    box-sizing: border-box;
    padding: 10px 0;
  }

  .mySwiper .swiper-slide {
    width: 25%;
    height: 100%;
    opacity: 0.4;
  }

  .mySwiper .swiper-slide-thumb-active {
    opacity: 1;
  }

  .swiper-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CustomButtonPrevious = styled.button`
  position: absolute;
  top: 50%;
  left: -17px;
  z-index: 2;

  height: 32px;
  width: 32px;

  background-color: #55c57a;
  border-radius: 50%;
  box-shadow: rgba(49, 53, 59, 0.12) 0px 1px 6px 0px;
  color: #f8f8f8;
  opacity: 0.9;
  padding-right: 2px;
`;

export const CustomButtonNext = styled.button`
  position: absolute;
  top: 50%;
  right: -17px;
  z-index: 2;

  height: 32px;
  width: 32px;

  background-color: #55c57a;
  border-radius: 50%;
  box-shadow: rgba(49, 53, 59, 0.12) 0px 1px 6px 0px;
  color: #f8f8f8;
  opacity: 0.9;
  padding-left: 2px;
`;

export default CarouselSimpleGalleryBase;
