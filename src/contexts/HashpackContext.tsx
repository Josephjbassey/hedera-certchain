import { createContext, ReactNode, useState } from "react";

const defaultValue = {
  hashpackAccountId: '',
  setHashpackAccountId: (newValue: string) => { },
}

export const HashpackContext = createContext(defaultValue)

export const HashpackContextProvider = (props: { children: ReactNode | undefined }) => {
  const [hashpackAccountId, setHashpackAccountId] = useState('')

  return (
    <HashpackContext.Provider
      value={{
        hashpackAccountId,
        setHashpackAccountId
      }}
    >
      {props.children}
    </HashpackContext.Provider>
  )
}