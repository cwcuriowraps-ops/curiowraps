import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export interface RequestValidationSchema {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  cookies?: ZodTypeAny;
  headers?: ZodTypeAny;
}

export function validateRequest(schema: RequestValidationSchema): RequestHandler {
  return (req, res, next) => {
    try {
      const locals = res.locals as {
        validated?: Record<string, unknown>;
      };

      if (schema.body) {
        locals.validated = { ...(locals.validated ?? {}), body: schema.body.parse(req.body) };
      }

      if (schema.params) {
        locals.validated = { ...(locals.validated ?? {}), params: schema.params.parse(req.params) };
      }

      if (schema.query) {
        locals.validated = { ...(locals.validated ?? {}), query: schema.query.parse(req.query) };
      }

      if (schema.cookies) {
        locals.validated = { ...(locals.validated ?? {}), cookies: schema.cookies.parse(req.cookies) };
      }

      if (schema.headers) {
        locals.validated = { ...(locals.validated ?? {}), headers: schema.headers.parse(req.headers) };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}