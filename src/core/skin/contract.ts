import type { ReactNode } from "react";

export type SkinView<Props> = (props: Props) => ReactNode | Promise<ReactNode>;

export type SkinViews<Contracts extends object> = {
  readonly [Id in keyof Contracts]: SkinView<Contracts[Id]>;
};
