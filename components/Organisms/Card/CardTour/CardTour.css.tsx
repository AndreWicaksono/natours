import styled from "@emotion/styled";

export const CardButtonLink = styled.a`
  grid-row: 1 / 3;

  display: inline-block;
  justify-self: end;
  align-self: center;

  backface-visibility: hidden;
  background-color: #55c57a;
  border: none;
  border-radius: calc(10rem / 16 * 10);
  color: #fff;
  cursor: pointer;
  font-size: calc(1.4rem / 16 * 10);
  font-weight: 400;
  padding: calc(1.25rem / 16 * 10) calc(3rem / 16 * 10);
  position: relative;
  text-decoration: none;
  text-transform: uppercase;
  transition: all 0.4s;

  &:active {
    box-shadow: calc(0 0.5rem / 16 * 10) calc(1rem / 16 * 10)
      rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:focus {
    background-color: #2e864b;
    outline: none;
  }

  &:hover {
    box-shadow: 0 calc(1rem / 16 * 10) calc(2rem / 16 * 10) rgba(0, 0, 0, 0.15);
    transform: translateY(-3px);
  }
`;

export const CardFooter = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: calc(1rem / 16 * 10);
  grid-row-gap: calc(1rem / 16 * 10);

  background-color: #f7f7f7;
  border-top: 1px solid #f1f1f1;
  font-size: calc(1.4rem / 16 * 10);
  margin-top: auto;
  padding: calc(1.6rem / 16 * 10) calc(1.6rem / 16 * 10);

  /* @media only screen and (min-width: 1024px) {
    padding: calc(1.6rem / 16 * 10) calc(3.6rem / 16 * 10);
  } */

  .card {
    &__footer-value {
      font-weight: 700;
    }

    &__footer-text {
      color: #999;
    }

    &__ratings {
      grid-row: 2 / 3;
    }
  }
`;

export const CardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-row-gap: calc(1.75rem / 16 * 10);
  grid-column-gap: calc(2rem / 16 * 10);

  padding: calc(1.6rem / 16 * 10) calc(1.6rem / 16 * 10);

  /* @media only screen and (min-width: 1024px) {
    padding: calc(1.6rem / 16 * 10) calc(3.6rem / 16 * 10);
  } */

  .card {
    &__data {
      display: grid;
      grid-template-columns: 20px 1fr;
      grid-column-gap: 8px;

      color: #777;
      font-size: calc(1.3rem / 16 * 10);
      font-weight: 300;
    }

    &__sub-heading {
      grid-column: 1 / -1;

      font-size: calc(1.2rem / 16 * 10);
      font-weight: 700;
      text-transform: uppercase;
    }

    &__text {
      grid-column: 1 / -1;

      font-size: calc(1.5rem / 16 * 10);
      font-style: italic;
      margin-top: calc(-1rem / 16 * 10);
      margin-bottom: calc(0.75rem / 16 * 10);
    }
  }
`;

const CardTourBase = styled.div`
  display: flex;
  flex-direction: column;

  backface-visibility: hidden;
  background-color: #fff;
  cursor: pointer;
  border-radius: 3px;
  box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 6px 0px;
  overflow: hidden;
  transition: 0.3s all;

  .card {
    &__header {
      position: relative;
    }

    &__picture {
      position: relative;

      height: calc(18rem / 16 * 10);

      clip-path: polygon(0 0, 100% 0%, 100% 83%, 0% 98%);

      @media only screen and (min-width: 1024px) {
        height: calc(22rem / 16 * 10);
      }

      &-overlay {
        position: absolute;

        height: 100%;
        width: 100%;

        opacity: 0.7;
        z-index: 1;
      }
    }
  }

  .heading-tertirary {
    position: absolute;
    bottom: calc(1rem / 16 * 10);
    right: calc(1.6rem / 16 * 10);
    z-index: 10;

    width: 70%;

    color: #fff;
    font-size: calc(2rem / 16 * 10); // 1.71875rem;
    font-weight: 300;
    text-align: right;
    text-transform: uppercase;

    span {
      box-decoration-break: clone;
      background-image: -webkit-gradient(
        linear,
        left top,
        right bottom,
        from(rgba(125, 213, 111, 0.85)),
        to(rgba(40, 180, 135, 0.85))
      );
      background-image: linear-gradient(
        to bottom right,
        rgba(125, 213, 111, 0.85),
        rgba(40, 180, 135, 0.85)
      );
      line-height: 1;
      padding: calc(1rem / 16 * 10) calc(1.5rem / 16 * 10);
    }
  }
`;

export default CardTourBase;
