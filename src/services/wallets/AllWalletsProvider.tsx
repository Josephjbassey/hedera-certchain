import { ReactNode } from "react"
import { MetamaskContextProvider } from "../../contexts/MetamaskContext"
import { WalletConnectContextProvider } from "../../contexts/WalletConnectContext"
import { HashpackContextProvider } from "../../contexts/HashpackContext"
import { BladeContextProvider } from "../../contexts/BladeContext"
import { MetaMaskClient } from "./metamask/metamaskClient"
import { WalletConnectClient } from "./walletconnect/walletConnectClient"
import { HashPackClient } from "./hashpack/hashpackClient"
import { BladeClient } from "./blade/bladeClient"

export const AllWalletsProvider = (props: {
  children: ReactNode | undefined
}) => {
  return (
    <MetamaskContextProvider>
      <WalletConnectContextProvider>
        <HashpackContextProvider>
          <BladeContextProvider>
            <MetaMaskClient />
            <WalletConnectClient />
            <HashPackClient />
            <BladeClient />
            {props.children}
          </BladeContextProvider>
        </HashpackContextProvider>
      </WalletConnectContextProvider>
    </MetamaskContextProvider>
  )
}
