import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const faqs = [
    {
        question: "What is a DID (Decentralized Identifier)?",
        answer: "A Decentralized Identifier (DID) is a new type of identifier that enables verifiable, decentralized digital identity. A DID refers to any subject (e.g., a person, organization, thing, data model, abstract entity, etc.) as determined by the controller of the DID. DIDs are controlled by their subject, independent from any centralized registry, identity provider, or certificate authority."
    },
    {
        question: "How do I receive credentials?",
        answer: "You can receive credentials by scanning a QR code provided by an issuer (like a university, employer, or government body). Once you scan the code, you'll be prompted to accept the credential offer, and it will be securely stored in your CryptLocker wallet."
    },
    {
        question: "How do I share proofs?",
        answer: "When a service (a 'verifier') requests proof of one of your credentials, you'll receive a proof request in your wallet. You can review the request, select which credential to use, and consent to sharing the required information. Only the information requested is shared, protecting your privacy."
    },
    {
        question: "What if my credential is revoked?",
        answer: "If an issuer revokes a credential (for example, if a professional license expires), its status in your wallet will be updated to 'Revoked'. You will no longer be able to use it to generate valid proofs. You can verify the status of any credential at any time from the credential details screen."
    }
];

export default function HelpPage() {
    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold font-headline">Help & Support</h1>
                <p className="text-muted-foreground">Find answers to your questions and get in touch with our team.</p>
            </header>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold font-headline mb-4">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                             <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                <AccordionContent>
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4">Contact Support</h2>
                     <Card>
                        <CardHeader>
                            <CardTitle>Submit a Ticket</CardTitle>
                            <CardDescription>Can't find an answer? Our team is here to help.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" placeholder="e.g., Issue with credential" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="Describe your issue in detail..." />
                            </div>
                            <Button className="w-full">Submit Ticket</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
