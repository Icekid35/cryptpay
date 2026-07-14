import "./globals.css";
import { Web3Provider } from "@/context/Web3Provider";

export const metadata = {
  title: "CryptPay - Decentralized Payment Links",
  description: "Create decentralized payment links, generate QR codes, and accept crypto payments directly to your wallet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
