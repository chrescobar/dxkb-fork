import type { Library } from "@/types/services";

export type ServiceLibraryKind = "paired" | "single" | "sra";

/**
 * The subset of the TanStack Form API that extracted card components are allowed to use.
 *
 * Cards may render `<form.Field>`, subscribe to `form.store` for derived UI state, and read
 * `form.state`. Cards SHOULD NOT call `form.setFieldValue` for fields other than the one their
 * `<form.Field>` is currently rendering — cross-field logic belongs in the page orchestrator.
 */
export interface ServiceCardForm<TForm> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Field: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: any;
  state: { values: TForm };
  // The real TanStack Form setFieldValue accepts Updater<V> (a value or updater function).
  // We type the value parameter as `any` so that concrete ReactFormExtendedApi<T>
  // instances are structurally assignable to ServiceCardForm<T>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldValue<K extends Extract<keyof TForm, string>>(field: K, value: any): void;
}
export type ServiceFormField<TForm> = Extract<keyof TForm, string>;

export interface ServiceFormApi<TForm = Record<string, unknown>> {
  getFieldValue<K extends ServiceFormField<TForm>>(field: K): TForm[K];
  setFieldValue<K extends ServiceFormField<TForm>>(
    field: K,
    value: TForm[K],
  ): void;
  reset?: (values?: TForm) => void;
}

interface ServiceRerunBaseConfig<
  TForm,
  TRerun extends Record<string, unknown> = Record<string, unknown>,
> {
  fields?: readonly (keyof TRerun & string)[];
  onApply?: (
    rerunData: TRerun,
    form: ServiceFormApi<TForm>,
    libraries: Library[],
  ) => void;
  defaultOutputPath?: null;
}

type ServiceRerunLibraryConfig =
  | {
      libraries?: undefined;
      getLibraryExtra?: never;
      syncLibraries?: never;
    }
  | {
      libraries: readonly ServiceLibraryKind[];
      getLibraryExtra?: (
        lib: Record<string, string>,
        kind: ServiceLibraryKind,
      ) => Partial<Library>;
      syncLibraries: (libs: Library[]) => void;
    };

export type ServiceRerunConfig<
  TForm,
  TRerun extends Record<string, unknown> = Record<string, unknown>,
> = ServiceRerunBaseConfig<TForm, TRerun> & ServiceRerunLibraryConfig;

export interface ServiceDefinition<
  TForm,
  TRerun extends Record<string, unknown> = Record<string, unknown>,
> {
  serviceName: string;
  displayName: string;
  defaultValues: TForm;
  transformParams(data: TForm): Record<string, unknown>;
  rerun?: ServiceRerunConfig<TForm, TRerun>;
}

export function createServiceDefinition<
  TForm,
  TRerun extends Record<string, unknown> = Record<string, unknown>,
>(
  definition: ServiceDefinition<TForm, TRerun>,
): ServiceDefinition<TForm, TRerun> {
  return definition;
}
