"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { useCamera, useSigma } from "@react-sigma/core";
import { Minus, Plus } from "lucide-react";

import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ratioToZoomPercent } from "./zoom-utils";

const zoomFactor = 1.5;

export function ZoomControl() {
  const sigma = useSigma();
  const { goto, zoomIn, zoomOut } = useCamera({
    factor: zoomFactor,
    duration: 150,
  });
  const camera = sigma.getCamera();
  const [zoomPercent, setZoomPercent] = useState(() =>
    ratioToZoomPercent(camera.ratio),
  );
  const [inputValue, setInputValue] = useState(() => String(zoomPercent));
  const cancelBlurRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const next = ratioToZoomPercent(camera.ratio);
      setZoomPercent(next);
      setInputValue(String(next));
    };
    camera.on("updated", update);
    return () => {
      camera.off("updated", update);
    };
  }, [camera]);

  function commitZoom() {
    const requested = Number(inputValue);
    if (!Number.isFinite(requested) || requested <= 0) {
      setInputValue(String(zoomPercent));
      return;
    }
    const ratio = camera.getBoundedRatio(100 / requested);
    goto({ ratio }, { duration: 150 });
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    commitZoom();
  }

  function handleBlur() {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false;
      return;
    }
    commitZoom();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitZoom();
      return;
    }
    if (event.key === "Escape") {
      cancelBlurRef.current = true;
      setInputValue(String(zoomPercent));
      event.currentTarget.blur();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute right-3 bottom-3 z-10"
      aria-label="Graph zoom"
    >
      <InputGroup className="grid h-9 w-36 grid-cols-[2rem_1fr_2rem] bg-card p-0.5 shadow-md">
        <InputGroupButton
          aria-label="Zoom out"
          size="icon-sm"
          className="size-8 justify-self-start rounded-md"
          onClick={() => {
            zoomOut();
          }}
        >
          <Minus />
        </InputGroupButton>
        <div className="flex min-w-0 items-center justify-center gap-0.5">
          <InputGroupInput
            aria-label="Zoom percentage"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ width: `${String(Math.max(inputValue.length, 1))}ch` }}
            className="h-8 flex-none [appearance:textfield] bg-transparent px-0 text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span
            aria-hidden
            className="pointer-events-none text-sm text-muted-foreground"
          >
            %
          </span>
        </div>
        <InputGroupButton
          aria-label="Zoom in"
          size="icon-sm"
          className="size-8 justify-self-end rounded-md"
          onClick={() => {
            zoomIn();
          }}
        >
          <Plus />
        </InputGroupButton>
      </InputGroup>
    </form>
  );
}
