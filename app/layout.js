import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "🌷 My Little Life",
  description: "A personal planner — plan, do, track, reflect, improve.",
};

const themeBoot = `try{var t=localStorage.getItem("mlf-look");if(t==="galaxy"||t==="boba"||t==="retro")document.documentElement.setAttribute("data-look",t);else document.documentElement.setAttribute("data-look","retro")}catch(e){}`;

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
