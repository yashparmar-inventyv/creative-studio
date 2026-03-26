import { createStore } from "zustand/vanilla"
import { StoreApi, useStore } from "zustand"
import React from "react"
import { persist, createJSONStorage } from "zustand/middleware"

// Updated: Use a proper type instead of `any`.
const createZustandContext = <TInitial, TStore extends StoreApi<unknown>>(
  getStore: (initial: TInitial) => TStore
) => {
  const Context = React.createContext<TStore | null>(null)

  const Provider = (props: {
    children?: React.ReactNode
    initialValue: TInitial
  }) => {
    const [store] = React.useState(() => getStore(props.initialValue))

    return <Context.Provider value={store}>{props.children}</Context.Provider>
  }

  return {
    useContext: () => {
      const context = React.useContext(Context)
      if (!context) {
        throw new Error("useContext must be used within a Provider")
      }
      return context
    },
    Context,
    Provider,
  }
}

type State = {
  tags: string[]
  setTags: (tags: string[]) => void
  activeTag: string
  setActiveTag: (tag: string) => void
  activeColor: string
  setActiveColor: (color: string) => void
  generating: boolean
  setGenerating: (generating: boolean) => void
}

const getStore = (initialState: {
  activeTag: string
  activeColor: string
  activeImage: string
}) => {
  return createStore<State>()(
    persist(
      (set) => ({
        tags: [],
        activeTag: initialState.activeTag,
        setTags: (tags) => set({ tags }),
        setActiveTag: (tag) => set({ activeTag: tag }),
        activeColor: initialState.activeColor,
        setActiveColor: (color) => set({ activeColor: color }),
        generating: false,
        setGenerating: (generating) => set({ generating }),
      }),
      {
        name: "image-storage",
        storage: createJSONStorage(() =>
          typeof window !== 'undefined' ? localStorage : {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        ),
      }
    )
  )
}

export const ImageStore = createZustandContext(getStore)

export function useImageStore<T>(selector: (state: State) => T) {
  const store = React.useContext(ImageStore.Context)
  if (!store) {
    throw new Error("Missing ImageStore provider")
  }
  return useStore(store, selector)
}