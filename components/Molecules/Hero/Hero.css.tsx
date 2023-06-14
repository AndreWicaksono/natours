import styled from "@emotion/styled";

export const Button = styled.button`
  background-color: #fff;
  color: #777;

  animation: moveInBottom 0.5s ease-out 0.75s;
  animation-fill-mode: none;
  -webkit-animation-fill-mode: backwards;
  animation-fill-mode: backwards;
  text-transform: uppercase;
  text-decoration: none;
  padding: 1rem 2.5rem;
  display: inline-block;
  border-radius: 10rem;
  -webkit-transition: all 0.2s;
  transition: all 0.2s;
  position: relative;
  font-size: 1rem;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    -webkit-box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.2);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.2);
  }
`;

const HeroBase = styled.header`
  position: relative;

  height: 40vh;

  @media only screen and (orientation: landscape) {
    height: 90vh
  }

  @media only screen and (min-width: 768px) and (orientation: landscape) {
    height: 75vh
  }

  @media only screen and (min-width: 768px) and (orientation: portrait) {
    height: 35vh;
  }

  @media only screen and (min-width: 1024px) {
    height: 50vh;
  }

  @media only screen and (min-width: 1280px) {
    height: 50vh;
  }

  .heading-primary {
    color: #fff;
    text-transform: uppercase;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    text-align: center;

    @media only screen and (min-width: 1024px) {
      text-align: unset;
    }

    &--main {
      display: block;
      font-weight: 400;
      letter-spacing: 1rem;
      -webkit-animation-name: moveInLeft;
      animation-name: moveInLeft;
      -webkit-animation-duration: 1s;
      animation-duration: 1s;
      -webkit-animation-timing-function: ease-out;
      animation-timing-function: ease-out;

      @media only screen and (min-width: 768px) {
        letter-spacing: 2rem;
      }
    }

    &--sub {
      display: block;
      font-weight: 700;
      letter-spacing: 0.5rem;
      -webkit-animation: moveInRight 1s ease-out;

      @media only screen and (min-width: 768px) {
        letter-spacing: 1rem;
      }
    }
  }

  &:before {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    background: linear-gradient(
      to right bottom,
      rgba(126, 213, 111, 0.8),
      rgba(40, 180, 133, 0.8)
    );
    content: "";
    z-index: 1;
  }
`;

export default HeroBase;
