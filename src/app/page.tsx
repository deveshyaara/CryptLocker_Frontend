import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Lock, QrCode, Share2 } from "lucide-react";
import { Logo } from "@/components/common/logo";

const features = [
  {
    icon: <Lock className="h-10 w-10 text-primary" />,
    title: "Decentralized & Secure",
    description: "Your identity, your data. Stored securely on your device, not on our servers.",
  },
  {
    icon: <Share2 className="h-10 w-10 text-primary" />,
    title: "Privacy-Focused",
    description: "Share only what's necessary. CryptLocker enables selective disclosure of your information.",
  },
    {
    icon: <CheckCircle2 className="h-10 w-10 text-primary" />,
    title: "Verifiable Credentials",
    description: "Receive and manage digitally signed credentials from trusted issuers worldwide.",
  },
];

const howItWorks = [
    {
    icon: <QrCode className="h-12 w-12 mx-auto mb-4 text-primary" />,
    step: "Step 1",
    title: "Connect & Receive",
    description: "Scan a QR code from an issuer (like a university or employer) to securely receive your digital credentials.",
  },
  {
    icon: <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />,
    step: "Step 2",
    title: "Store Securely",
    description: "Your credentials are encrypted and stored only in your CryptLocker wallet, under your full control.",
  },
  {
    icon: <Share2 className="h-12 w-12 mx-auto mb-4 text-primary" />,
    step: "Step 3",
    title: "Share with Consent",
    description: "When a service needs to verify your info, present a cryptographic proof without revealing unnecessary data.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
            The Future of Digital Identity is Here.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            CryptLocker is your secure, decentralized wallet for managing digital credentials. Take control of your personal data and share it on your own terms.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Create Your Secure Wallet</Link>
          </Button>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-secondary/50 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  {feature.icon}
                  <h3 className="text-xl font-headline font-bold mt-4 mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">A Simple, Secure Flow</h2>
                    <p className="text-lg text-muted-foreground mt-2">Manage your identity in three easy steps.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    {howItWorks.map((step) => (
                        <Card key={step.step} className="bg-card">
                            <CardHeader>
                                {step.icon}
                                <p className="text-sm font-semibold text-primary">{step.step}</p>
                                <CardTitle className="font-headline">{step.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{step.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center">
          <Logo />
          <p className="text-sm text-muted-foreground mt-4 sm:mt-0">
            © {new Date().getFullYear()} CryptLocker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
