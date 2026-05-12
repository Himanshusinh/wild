"use client";

import type { FC } from "react";
import { useEditImageInterface } from "./useEditImageInterface";
import { EditImageInterfaceView } from "./EditImageInterfaceView";

const EditImageInterface: FC = () => {
  const vm = useEditImageInterface();
  return <EditImageInterfaceView vm={vm} />;
};

export default EditImageInterface;
