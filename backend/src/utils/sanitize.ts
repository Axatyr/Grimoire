export interface CustomProperty {
  id?: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export const sanitizeEntity = <T extends Record<string, any>>(entity: T, isMaster: boolean): T => {
  if (!entity) return entity;
  if (isMaster) return entity;

  const copy: any = { ...entity };

  // Filter customProperties if present
  if (copy.customProperties && Array.isArray(copy.customProperties)) {
    copy.customProperties = (copy.customProperties as CustomProperty[]).filter(
      (p) => !p.isSecret
    );
  }

  // Filter NPC secrets if present
  if ('secrets' in copy) {
    delete copy.secrets;
  }

  return copy as T;
};

export const sanitizeList = <T extends Record<string, any>>(list: T[], isMaster: boolean): T[] => {
  if (!list) return [];
  if (isMaster) return list;
  return list.map((item) => sanitizeEntity(item, isMaster));
};
