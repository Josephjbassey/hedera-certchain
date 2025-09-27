import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";
import { connectToHashPack } from "../services/wallets/hashpack/hashpackClient";
import { connectToBlade } from "../services/wallets/blade/bladeClient";

interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: () => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  const handleWalletConnect = async (walletType: string) => {
    try {
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
          success = true;
          break;
        case 'walletconnect':
          await openWalletConnectModal();
          success = true;
          break;
        default:
          console.error('Unknown wallet type:', walletType);
      }
      
      if (success) {
        setOpen(false);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
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