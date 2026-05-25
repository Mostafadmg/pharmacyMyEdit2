import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CUSTOM_TAG_MAX_COUNT,
  customTagIdFromLabel,
  loadCustomOrderTags,
  saveCustomOrderTags,
  validateCustomTagLabel,
  type CustomOrderTag,
  type ValidateCustomTagResult,
} from "@/lib/customOrderTags";

type CustomOrderTagsContextValue = {
  customTags: CustomOrderTag[];
  addCustomTag: (label: string) => ValidateCustomTagResult;
  removeCustomTag: (id: string) => void;
  renameCustomTag: (id: string, label: string) => ValidateCustomTagResult;
};

const CustomOrderTagsContext = createContext<CustomOrderTagsContextValue | null>(
  null,
);

export function CustomOrderTagsProvider({ children }: { children: ReactNode }) {
  const [customTags, setCustomTags] = useState<CustomOrderTag[]>(() =>
    loadCustomOrderTags(),
  );

  const reload = useCallback(() => {
    setCustomTags(loadCustomOrderTags());
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("pharmacare:rx-custom-order-tags")) reload();
    };
    const onCustom = () => reload();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pharmacare:custom-order-tags-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pharmacare:custom-order-tags-changed", onCustom);
    };
  }, [reload]);

  const persist = useCallback((next: CustomOrderTag[]) => {
    setCustomTags(next);
    saveCustomOrderTags(next);
  }, []);

  const addCustomTag = useCallback(
    (label: string): ValidateCustomTagResult => {
      if (customTags.length >= CUSTOM_TAG_MAX_COUNT) {
        return {
          ok: false,
          error: `You can save up to ${CUSTOM_TAG_MAX_COUNT} custom tags.`,
        };
      }
      const validated = validateCustomTagLabel(label, customTags);
      if (!validated.ok) return validated;
      const id = customTagIdFromLabel(
        validated.label,
        customTags.map((t) => t.id),
      );
      const next = [...customTags, { id, label: validated.label }];
      persist(next);
      return { ok: true, label: validated.label };
    },
    [customTags, persist],
  );

  const removeCustomTag = useCallback(
    (id: string) => {
      persist(customTags.filter((t) => t.id !== id));
    },
    [customTags, persist],
  );

  const renameCustomTag = useCallback(
    (id: string, label: string): ValidateCustomTagResult => {
      const validated = validateCustomTagLabel(label, customTags, id);
      if (!validated.ok) return validated;
      persist(
        customTags.map((t) =>
          t.id === id ? { ...t, label: validated.label } : t,
        ),
      );
      return validated;
    },
    [customTags, persist],
  );

  const value = useMemo(
    () => ({
      customTags,
      addCustomTag,
      removeCustomTag,
      renameCustomTag,
    }),
    [customTags, addCustomTag, removeCustomTag, renameCustomTag],
  );

  return (
    <CustomOrderTagsContext.Provider value={value}>
      {children}
    </CustomOrderTagsContext.Provider>
  );
}

export function useCustomOrderTags(): CustomOrderTagsContextValue {
  const ctx = useContext(CustomOrderTagsContext);
  if (!ctx) {
    throw new Error(
      "useCustomOrderTags must be used within CustomOrderTagsProvider",
    );
  }
  return ctx;
}
