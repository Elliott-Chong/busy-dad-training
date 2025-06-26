import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SoundProvider } from "@/components/SoundProvider";

export const metadata: Metadata = {
	title: "Burpee Workout Timer",
	description: "6-count burpee workout timer with voice callouts",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
		viewportFit: "cover",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Burpee Timer",
	},
	formatDetection: {
		telephone: false,
	},
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<body>
				<TRPCReactProvider>
					<SoundProvider>
						{children}
					</SoundProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
