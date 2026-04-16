import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";
import { JsonRpcError, jsonRpcErrorCodes } from "@/lib/jsonrpc-client";
import { statusToErrorCode } from "./types";
import type { ApiErrorCode } from "./types";

function rpcCodeToHttpStatus(rpcCode: number, fallback: number): number {
  switch (rpcCode) {
    case jsonRpcErrorCodes.UNAUTHORIZED:
      return 401;
    case jsonRpcErrorCodes.FORBIDDEN:
      return 403;
    case jsonRpcErrorCodes.NOT_FOUND:
      return 404;
    case jsonRpcErrorCodes.VALIDATION_ERROR:
    case jsonRpcErrorCodes.INVALID_PARAMS:
      return 400;
    default:
      return fallback;
  }
}

export function errorResponse(
  error: unknown,
  fallbackStatus = 500,
): NextResponse {
  if (error instanceof JsonRpcError) {
    const status = rpcCodeToHttpStatus(error.code, fallbackStatus);
    return NextResponse.json(
      {
        error: error.message,
        code: statusToErrorCode(status),
        details: error.data,
      },
      { status },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message, code: "upstream" as ApiErrorCode },
      { status: fallbackStatus },
    );
  }

  return NextResponse.json(
    { error: "Internal server error", code: "unknown" as ApiErrorCode },
    { status: fallbackStatus },
  );
}

type AuthedHandler<TContext> = (
  request: NextRequest,
  context: TContext & { token: string },
) => Promise<NextResponse>;

export function withAuth<TContext = object>(
  handler: AuthedHandler<TContext>,
): (request: NextRequest, context: TContext) => Promise<NextResponse> {
  return async (request: NextRequest, context: TContext) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return NextResponse.json(
          { error: "Authentication required", code: "unauthenticated" },
          { status: 401 },
        );
      }
      return await handler(request, { ...context, token });
    } catch (error) {
      console.error("Route handler error:", error);
      return errorResponse(error);
    }
  };
}

type OptionalAuthHandler<TContext> = (
  request: NextRequest,
  context: TContext & { token: string | undefined },
) => Promise<NextResponse>;

export function withOptionalAuth<TContext = object>(
  handler: OptionalAuthHandler<TContext>,
): (request: NextRequest, context: TContext) => Promise<NextResponse> {
  return async (request: NextRequest, context: TContext) => {
    try {
      const token = await getAuthToken();
      return await handler(request, { ...context, token });
    } catch (error) {
      console.error("Route handler error:", error);
      return errorResponse(error);
    }
  };
}

type PlainHandler<TContext> = (
  request: NextRequest,
  context: TContext,
) => Promise<NextResponse>;

export function withErrorHandling<TContext = object>(
  handler: PlainHandler<TContext>,
): (request: NextRequest, context: TContext) => Promise<NextResponse> {
  return async (request: NextRequest, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("Route handler error:", error);
      return errorResponse(error);
    }
  };
}
