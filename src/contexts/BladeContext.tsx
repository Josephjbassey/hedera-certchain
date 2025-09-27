import { createContext, ReactNode, useState } from "react";

const defaultValue = {
  bladeAccountId: '',
  setBladeAccountId: (newValue: string) => { },
}

export const BladeContext = createContext(defaultValue)

export const BladeContextProvider = (props: { children: ReactNode | undefined }) => {
  const [bladeAccountId, setBladeAccountId] = useState('')

  return (
    <BladeContext.Provider
      value={{
        bladeAccountId,
        setBladeAccountId
      }}
    >
      {props.children}
    </BladeContext.Provider>
  )
}