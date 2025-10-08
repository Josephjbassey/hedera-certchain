import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQPage: React.FC = () => {
  const faqs = [
    {
      question: "What is Hedera CertChain?",
      answer: "Hedera CertChain is a blockchain-based certificate verification system that allows institutions to issue tamper-proof digital certificates and enables instant verification of credentials."
    },
    {
      question: "How does blockchain verification work?",
      answer: "Each certificate is hashed and stored on the Hedera blockchain, creating an immutable record. When someone verifies a certificate, the system checks the blockchain to confirm its authenticity and ensure it hasn't been tampered with."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, all certificate data is encrypted and stored securely. The blockchain only stores cryptographic hashes, not the actual certificate content. Your private keys never leave your device."
    },
    {
      question: "How much does it cost?",
      answer: "Transaction costs on Hedera are very low (typically a fraction of a cent). We offer flexible pricing plans for institutions based on their certificate volume."
    },
    {
      question: "Can I verify certificates for free?",
      answer: "Yes! Certificate verification is completely free and available to anyone. No wallet connection required for verification."
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <HelpCircle className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-5xl font-bold">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about our blockchain certificate system
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-3xl mx-auto"
      >
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  );
};

export default FAQPage;
