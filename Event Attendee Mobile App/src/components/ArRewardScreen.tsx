import { CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface ArRewardScreenProps {
  onClose: () => void;
}

export function ArRewardScreen({ onClose }: ArRewardScreenProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-500 to-emerald-600">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="animate-bounce mb-8">
          <CheckCircle className="w-32 h-32 text-white" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-white text-center mb-4">Badge Unlocked!</h1>
        
        <p className="text-white/90 text-center mb-8 max-w-md">
          Congratulations! You've successfully completed the navigation challenge.
        </p>

        <Button 
          size="lg" 
          variant="secondary"
          onClick={onClose}
          className="bg-white text-green-600 hover:bg-gray-100"
        >
          Continue Exploring
        </Button>
      </div>
    </div>
  );
}
