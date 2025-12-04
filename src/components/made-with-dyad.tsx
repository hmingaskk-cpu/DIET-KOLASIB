import { Sparkles } from "lucide-react";
import React from "react";

export const MadeWithDyad = () => {
  return (
    <div className="flex items-center justify-center p-2">
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-300 hover:text-white flex items-center space-x-1 transition-colors"
      >
        <Sparkles className="h-4 w-4 text-app-green" />
        <span>Made with Dyad</span>
      </a>
    </div>
  );
};