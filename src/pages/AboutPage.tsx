import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Users, Target, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-5xl font-bold">About Hedera CertChain</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're revolutionizing credential verification using blockchain technology to create
          tamper-proof, instantly verifiable certificates.
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/50">
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-3xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
              To eliminate credential fraud and provide institutions with a trustworthy,
              blockchain-based system for issuing and verifying academic and professional
              certificates worldwide.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Values */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="text-3xl font-bold text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Security First</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built on Hedera's enterprise-grade blockchain for maximum security and reliability.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Trust & Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Every certificate is verifiable on the public blockchain, ensuring complete transparency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Innovation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Leveraging cutting-edge blockchain technology to solve real-world credentialing challenges.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Technology Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-3xl font-bold text-center">Why Hedera?</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Fast & Efficient</h3>
                <p className="text-muted-foreground">
                  Hedera's hashgraph consensus algorithm provides finality in seconds with
                  minimal energy consumption.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Low Cost</h3>
                <p className="text-muted-foreground">
                  Transaction fees are predictably low, making it affordable for institutions
                  of all sizes.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Enterprise-Grade Security</h3>
                <p className="text-muted-foreground">
                  Governed by world-leading organizations, ensuring stability and security.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Carbon Negative</h3>
                <p className="text-muted-foreground">
                  The most environmentally sustainable public blockchain network.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AboutPage;
