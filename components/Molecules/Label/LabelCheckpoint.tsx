import React, { HTMLAttributes } from "react";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

export type LabelCheckpoint_CheckpointBullet_PathObject = {
  top?: { color?: string; size?: number };
  bottom?: { color?: string; size?: number };
};

const LabelCheckpoint: React.FC<
  {
    fontSize?: number;
    path?: LabelCheckpoint_CheckpointBullet_PathObject;
    text?: string;
  } & HTMLAttributes<HTMLDivElement>
> = ({
  children,
  path = {
    top: { color: "#ccc", size: 12 },
    bottom: { color: "#ccc", size: 8 },
  },
  text,
  ...props
}) => {
  return (
    <LabelCheckpointBase {...props}>
      <CheckpointBullet path={path} />
      {text && <p className="pl-2">{text}</p>}
      {children && children}
    </LabelCheckpointBase>
  );
};

const LabelCheckpointBase = styled.div<{ fontSize?: number }>`
  position: relative;

  & > p {
    display: inline-block;

    font-size: ${({ fontSize }) => (fontSize ? `${fontSize}px` : "14px")};
    font-weight: 300;
    line-height: 20px;
  }
`;

const CheckpointBullet = styled.span<{
  path: LabelCheckpoint_CheckpointBullet_PathObject;
}>`
  position: relative;

  display: inline-block;

  height: 8px;
  width: 8px;

  background-color: #55c57a;
  border-radius: 50%;
  content: "";

  ${({ path }) => {
    if (path?.bottom?.size === 0) return "";

    const defaultValue = { color: "#ccc", size: 8 };

    return css`
      &:after {
        position: absolute;
        right: 0;
        bottom: -${path?.bottom?.size ?? defaultValue.size}px;
        left: 0;
        margin: 0 auto;

        display: inline-block;

        height: ${path?.bottom?.size ?? defaultValue.size}px;
        width: 1px;

        border: 1px dashed ${path?.bottom?.color ?? defaultValue.color};
        content: "";
      }
    `;
  }}

  ${({ path }) => {
    if (path?.top?.size === 0) return "";

    const defaultValue = { color: "#ccc", size: 12 };

    return css`
      &:before {
        position: absolute;
        top: -${path?.top?.size ?? defaultValue.size}px;
        right: 0;
        left: 0;
        margin: 0 auto;

        display: inline-block;

        height: ${path?.top?.size ?? defaultValue.size}px;
        width: 1px;

        border: 1px dashed ${path?.top?.color ?? defaultValue.color};
        content: "";
      }
    `;
  }}
`;

export default LabelCheckpoint;
