"use client";

import React from "react";
import { MadeWithDyad } from "./made-with-dyad";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-deep-blue text-white p-4 text-center text-sm mt-auto hidden md:block"> {/* Added hidden md:block */}
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <p>&copy; {currentYear} DIET KOLASIB. All rights reserved.</p>
        <MadeWithDyad />
      </div>
    </footer>
  );
};

export default Footer;