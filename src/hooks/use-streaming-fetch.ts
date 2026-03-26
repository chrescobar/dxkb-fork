"use client";

import { useEffect, useRef, useState } from "react";

interface StreamingFetchState {
  content: string;
  bytesLoaded: number;
  totalBytes: number | null;
  isLoading: boolean;
  isComplete: boolean;
  error: Error | null;
}

export function useStreamingFetch(url: string) {
  const [state, setState] = useState<StreamingFetchState>({
    content: "",
    bytesLoaded: 0,
    totalBytes: null,
    isLoading: true,
    isComplete: false,
    error: null,
  });

  const urlRef = useRef(url);
  urlRef.current = url;

  useEffect(() => {
    const controller = new AbortController();
    const decoder = new TextDecoder();
    let accumulated = "";
    let loaded = 0;

    setState({
      content: "",
      bytesLoaded: 0,
      totalBytes: null,
      isLoading: true,
      isComplete: false,
      error: null,
    });

    async function stream() {
      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Failed to load file (HTTP ${response.status})`);
        }

        const contentLength = response.headers.get("Content-Length");
        const total = contentLength ? parseInt(contentLength, 10) : null;

        if (total !== null) {
          setState((prev) => ({ ...prev, totalBytes: total }));
        }

        const body = response.body;
        if (!body) {
          const text = await response.text();
          setState({
            content: text,
            bytesLoaded: new TextEncoder().encode(text).length,
            totalBytes: total,
            isLoading: false,
            isComplete: true,
            error: null,
          });
          return;
        }

        const reader = body.getReader();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          loaded += value.byteLength;
          accumulated += decoder.decode(value, { stream: true });

          setState({
            content: accumulated,
            bytesLoaded: loaded,
            totalBytes: total,
            isLoading: true,
            isComplete: false,
            error: null,
          });
        }

        // Flush any remaining bytes from the decoder
        accumulated += decoder.decode();

        setState({
          content: accumulated,
          bytesLoaded: loaded,
          totalBytes: total,
          isLoading: false,
          isComplete: true,
          error: null,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isComplete: false,
          error: err instanceof Error ? err : new Error("Unknown error"),
        }));
      }
    }

    stream();

    return () => controller.abort();
  }, [url]);

  return state;
}
