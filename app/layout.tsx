import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Memoir - Daddy & Puppy",
  description: "Interactive storytelling and memory sharing platform with cloud synchronization",
  keywords: ["memoir", "memories", "timeline", "mood tracking", "photo sharing"],
  authors: [{ name: "Memoir App" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}