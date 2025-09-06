// app/layout.tsx atau sesuai dengan struktur project kamu
import type { Metadata } from "next";
import { DynaPuff } from "next/font/google";

import { Home, Gamepad2, ScrollText, Settings } from 'lucide-react'

import "./globals.css";

const defaultFont = DynaPuff({
  weight: '400',
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: "Langit Saga Game",
  description: "a hundred games to enjoy with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${defaultFont.className} antialiased min-h-screen`}
      >
        <div className="navbar bg-base-300 text-primary-content px-4 mb-5">
          <div className="navbar-start">
            <a className="text-xl text-primary">LANGIT SAGA</a>
          </div>
          <div className="navbar-end">
            <label className="input input-sm">
              <input type="search" className="grow  text-primary" placeholder="Search" />
              <kbd className="kbd kbd-sm text-primary">⌘</kbd>
              <kbd className="kbd kbd-sm text-primary">K</kbd>
            </label>
          </div>
        </div>
        <div className="flex flex-1 min-h-screen">
          <ul className="menu menu-vertical">
            <li>
              <a className="flex items-center gap-2 text-primary">
                <Home size={18} className="text-primary" /> Dashboard
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 text-info">
                <Gamepad2 size={18} className="text-info" /> Game Room
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 text-info">
                <ScrollText size={18} className="text-accent" /> History
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 text-info">
                <Settings size={18} className="text-warning" /> Settings
              </a>
            </li>
            <li>
              <a>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Inbox
                <span className="badge badge-xs">99+</span>
              </a>
            </li>
            <li>
              <a>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updates
                <span className="badge badge-xs badge-warning">NEW</span>
              </a>
            </li>
            <li>
              <a>
                Stats
                <span className="badge badge-xs badge-info"></span>
              </a>
            </li>
          </ul>

          <div className="main-wrapper flex-1 overflow-auto p-4 mb-4">
            <main>
              {children}
            </main>
          </div>
        </div>


        <footer className="footer sm:footer-horizontal bg-base-200 text-neutral-content items-center px-4 py-4">
          <aside className="grid-flow-col items-center">
            <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
          </aside>
          <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path
                  d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
              </svg>
            </a>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path
                  d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
              </svg>
            </a>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path
                  d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
              </svg>
            </a>
          </nav>
        </footer>
      </body>
    </html >
  );
}
