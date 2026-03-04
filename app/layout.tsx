import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Script to Assets — 剧本资产统筹",
    description: "AI驱动的剧本资产梳理与提示词生成工具",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
