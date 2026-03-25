export type Position =
  | LeftTopPosition
  | RightTopPosition
  | LeftBottomPosition
  | RightBottomPosition;

export type LeftTopPosition = {
  left: number;
  top: number;
};

export type RightTopPosition = {
  right: number;
  top: number;
};

export type LeftBottomPosition = {
  left: number;
  bottom: number;
};

export type RightBottomPosition = {
  right: number;
  bottom: number;
};
