import styled from "@emotion/styled";

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

const CarouselTourBase = styled.div`
  position: relative;

  .swiper {
    position: unset;
  }

  .swiper-button-next,
  .swiper-button-prev {
    display: none;
  }

  .swiper-pagination-bullet-active {
    background: #55c57a;
  }

  .swiper-slide {
    height: auto;

    display: flex;
    flex-grow: 1;
  }
`;

export default CarouselTourBase;
