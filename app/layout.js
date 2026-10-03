import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "🌷 My Little Life",
  description: "A personal planner — plan, do, track, reflect, improve.",
};

const themeBoot = `try{if(localStorage.getItem("mlf-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
