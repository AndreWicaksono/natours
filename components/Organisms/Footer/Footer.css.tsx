import styled from "@emotion/styled";

const FooterBase = styled.footer`
  background-color: #333;
  color: #f7f7f7;
`;

export const FooterCopyright = styled.p`
  font-size: 0.7rem;
  font-weight: 400;
  padding-top: 1rem;
  padding-right: 1.5rem;
  padding-left: 1.5rem;

  @media only screen and (min-width: 1024px) {
    border-top: 1px solid #777;
    font-size: 0.7875rem;
    padding-right: unset;
    padding-left: unset;

    a {
      display: inline-block;
      transition: all 0.2s;

      &:hover {
        color: #55c57a;
        -webkit-box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.4);
        box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.4);
        -webkit-transform: rotate(5deg) scale(1.3);
        transform: rotate(5deg) scale(1.3);
      }

      &:visited {
        transition: all 0.2s;
      }
    }
  }
`;

export const NavigationLinks = styled.nav`
  color: #f7f7f7;
  padding-right: 1.5rem;
  padding-left: 1.5rem;

  @media only screen and (min-width: 1024px) {
    border-bottom: unset;
    padding-right: unset;
    padding-left: unset;
  }

  ul {
    border-top: 1px solid #777;
    border-bottom: 1px solid #777;
    font-size: 0.7rem;
    font-weight: 400;
    padding-top: 1rem;
    padding-bottom: 3rem;
    text-transform: uppercase;

    @media only screen and (min-width: 1024px) {
      border-bottom: unset;
    }

    li {
      display: inline-block;
      font-size: 0.7rem;
      line-height: 1.7;

      a {
        display: inline-block;
      }

      @media only screen and (min-width: 1024px) {
        font-size: 0.7875rem;

        a {
          transition: all 0.2s;

          &:hover {
            color: #55c57a;
            -webkit-box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.4);
            box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.4);
            -webkit-transform: rotate(5deg) scale(1.3);
            transform: rotate(5deg) scale(1.3);
          }

          &:visited {
            transition: all 0.2s;
          }
        }
      }

      &:not(:last-child) {
        margin-right: 0.75rem;
      }
    }
  }
`;

export default FooterBase;
