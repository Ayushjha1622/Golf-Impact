import { Montserrat, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata = {
  title: "Golf Impact | Play for a Cause, Win for a Lifetime",
  description: "Join the most exclusive charity golf subscription. Track your progress, enter monthly draws, and make a real difference in the world.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-blue-500/30">
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '14px' },
            success: { iconTheme: { primary: '#3B82F6', secondary: '#F8FAFC' } },
            error: { iconTheme: { primary: '#F43F5E', secondary: '#F8FAFC' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
