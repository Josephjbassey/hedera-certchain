/**
 * Wallet Selection Dialog Component
 * 
 * This component provides a user-friendly interface for connecting to different
 * types of Hedera-compatible wallets. It displays all available wallet options
 * with clear descriptions and branding.
 * 
 * Supported Wallets:
 * - HashPack: Native Hedera wallet (recommended for best compatibility)
 * - Blade: Hedera-focused wallet with advanced features
 * - MetaMask: Popular Ethereum wallet with Hedera EVM support
 * - WalletConnect: Mobile and cross-platform wallet connections
 * 
 * The dialog maintains the original theme and styling - no visual changes made.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";
import { connectToHashPack } from "../services/wallets/hashpack/hashpackClient";
import { connectToBlade } from "../services/wallets/blade/bladeClient";

/**
 * Props for the WalletSelectionDialog component
 */
interface WalletSelectionDialogProps {
  /** Whether the dialog is currently open */
  open: boolean;
  /** Function to control dialog open/close state */
  setOpen: (value: boolean) => void;
  /** Callback function called when dialog is closed */
  onClose: () => void;
}

/**
 * Wallet selection dialog component
 * 
 * Displays a modal dialog with buttons for connecting to different wallet types.
 * Handles the connection process and closes the dialog on successful connection.
 * 
 * @param props - Component props for controlling dialog state
 * @returns JSX element containing the wallet selection dialog
 */
export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  /**
   * Handles wallet connection based on the selected wallet type
   * 
   * This function centralizes the wallet connection logic and handles
   * different connection patterns for each wallet type:
   * - HashPack & Blade: Direct connection with success/failure response
   * - MetaMask & WalletConnect: Promise-based connection (assumed successful if no error)
   * 
   * @param walletType - The type of wallet to connect to
   */
  const handleWalletConnect = async (walletType: string) => {
    try {
      console.log(`🔗 Attempting to connect to ${walletType} wallet...`);
      let success = false;
      
      switch (walletType) {
        case 'hashpack':
          success = await connectToHashPack();
          break;
          
        case 'blade':
          success = await connectToBlade();
          break;
          
        case 'metamask':
          await connectToMetamask();
          success = true; // MetaMask throws error on failure, so reaching here means success
          break;
          
        case 'walletconnect':
          await openWalletConnectModal();
          success = true; // WalletConnect throws error on failure, so reaching here means success
          break;
          
        default:
          console.error('❌ Unknown wallet type:', walletType);
          return; // Exit early for unknown wallet types
      }
      
      // Close dialog only if connection was successful
      if (success) {
        console.log(`✅ Successfully connected to ${walletType}`);
        setOpen(false);
      } else {
        console.warn(`⚠️ Failed to connect to ${walletType}`);
      }
    } catch (error) {
      console.error(`❌ ${walletType} connection error:`, error);
      // Keep dialog open so user can try again or choose different wallet
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 p-6">
          {/* HashPack - Direct Connection */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleWalletConnect('hashpack')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                H
              </div>
              <div className="text-left">
                <div className="font-medium">HashPack</div>
                <div className="text-sm text-gray-500">Native Hedera wallet</div>
              </div>
            </div>
          </Button>

          {/* Blade - Direct Connection */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleWalletConnect('blade')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                ⚔️
              </div>
              <div className="text-left">
                <div className="font-medium">Blade Wallet</div>
                <div className="text-sm text-gray-500">Hedera-focused wallet</div>
              </div>
            </div>
          </Button>
          
          {/* MetaMask */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleWalletConnect('metamask')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg">
                🦊
              </div>
              <div className="text-left">
                <div className="font-medium">MetaMask</div>
                <div className="text-sm text-gray-500">Ethereum & Hedera EVM</div>
              </div>
            </div>
          </Button>

          {/* WalletConnect - Fallback */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleWalletConnect('walletconnect')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                WC
              </div>
              <div className="text-left">
                <div className="font-medium">WalletConnect</div>
                <div className="text-sm text-gray-500">Other Hedera wallets</div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};