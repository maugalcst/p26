"use client";

import { useRef, type ReactNode } from "react";
import { useRotatingCursor } from "@/hooks/useRotatingCursor";
import "./RotatingCursor.css";

export default function RotatingCursor({ children }: { children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const crossRef = useRef<HTMLDivElement>(null);

  useRotatingCursor(areaRef, crossRef);

  return (
    <div ref={areaRef} className="rotating-cursor-area">
      <div ref={crossRef} className="cursor-cross" aria-hidden="true" />
      <div className="cursor-coord-layer" aria-hidden="true">
        <span className="cursor-coord cursor-coord--x" />
        <span className="cursor-coord cursor-coord--y" />
      </div>
      {children}
    </div>
  );
}