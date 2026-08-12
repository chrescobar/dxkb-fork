import { useReducer, useRef } from "react";

type StateSetter<T> = (value: T | ((previous: T) => T)) => void;

type StateAction<T> = {
  [K in keyof T]: { key: K; value: T[K] | ((previous: T[K]) => T[K]) };
}[keyof T];

function stateReducer<T extends object>(state: T, action: StateAction<T>): T {
  const value =
    typeof action.value === "function"
      ? (
          action.value as (
            previous: T[typeof action.key],
          ) => T[typeof action.key]
        )(state[action.key])
      : action.value;

  return Object.is(state[action.key], value)
    ? state
    : { ...state, [action.key]: value };
}

export function useServicePageState<T extends object>(initialState: T) {
  const [state, dispatch] = useReducer(stateReducer<T>, initialState);
  const settersRef = useRef<Partial<{ [K in keyof T]: StateSetter<T[K]> }>>({});

  function setter<K extends keyof T>(key: K): StateSetter<T[K]> {
    const existingSetter = settersRef.current[key];
    if (existingSetter) return existingSetter;

    const nextSetter: StateSetter<T[K]> = (value) => {
      dispatch({ key, value } as StateAction<T>);
    };
    settersRef.current[key] = nextSetter;
    return nextSetter;
  }

  return [state, setter] as const;
}
