import { Request } from 'express';

export const getParam = (req: Request, name: string): string => {
  const val = req.params[name];
  if (Array.isArray(val)) {
    return val[0] || '';
  }
  return val || '';
};

export const getQueryParam = (req: Request, name: string): string | undefined => {
  const val = req.query[name];
  if (Array.isArray(val)) {
    return val[0]?.toString();
  }
  return val?.toString();
};
