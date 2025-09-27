import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";

interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: () => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 p-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              openWalletConnectModal();
              setOpen(false);
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                WC
              </div>
              <div className="text-left">
                <div className="font-medium">WalletConnect</div>
                <div className="text-sm text-gray-500">HashPack, Blade, Kabila</div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              connectToMetamask();
              setOpen(false);
            }}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};