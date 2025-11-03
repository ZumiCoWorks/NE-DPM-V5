import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

interface NavigationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanNow: () => void;
}

export function NavigationPromptModal({ isOpen, onClose, onScanNow }: NavigationPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-center">Start Navigation</DialogTitle>
          <DialogDescription className="text-center">
            To start navigation, please scan the nearest "You Are Here" QR marker.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          <Button onClick={onScanNow} className="w-full">
            Scan Now
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
