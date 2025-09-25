import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileCheck, QrCode, Users, ArrowRight, CheckCircle, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SystemStatus from '@/components/SystemStatus';

/**
 * Landing page for Hedera CertChain
 * Showcases the platform's benefits and guides users to get started
 */
export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Certificates secured on Hedera's enterprise-grade distributed ledger technology."
    },
    {
      icon: FileCheck,
      title: "Instant Verification",
      description: "Verify any certificate in seconds with tamper-proof blockchain validation."
    },
    {
      icon: QrCode,
      title: "QR Code Integration",
      description: "Generate shareable QR codes for easy certificate verification anywhere."
    },
    {
      icon: Users,
      title: "Multi-Institution",
      description: "Support for educational institutions, certification bodies, and enterprises."
    }
  ];

  const benefits = [
    "Immutable certificate records",
    "Instant global verification", 
    "Fraud prevention",
    "Cost-effective solution",
    "Environmental sustainability",
    "Regulatory compliance"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Secure Certificate
                </span>
                <br />
                <span className="text-foreground">
                  Verification on Blockchain
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Issue and verify educational certificates, professional certifications, and credentials 
                using Hedera's fast, secure, and sustainable blockchain technology.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button variant="hero" size="lg" asChild className="text-lg px-8 py-6">
                <a href="/setup">
                  Setup Guide
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
                <a href="/verify">
                  Verify Certificate
                </a>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-8 max-w-md mx-auto"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Secure</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">&lt; 3s</div>
                <div className="text-sm text-muted-foreground">Verification</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose Hedera CertChain?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on Hedera Hashgraph for unmatched security, speed, and sustainability
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-elevated transition-all duration-300 group">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-gradient-primary rounded-lg w-fit group-hover:animate-glow-pulse">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Trust & Transparency
                <br />
                <span className="bg-gradient-secondary bg-clip-text text-transparent">
                  Built In
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every certificate is cryptographically secured and publicly verifiable 
                on the Hedera network, ensuring authenticity and preventing fraud.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="bg-gradient-card border-0 shadow-elevated">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-primary rounded-lg">
                      <Globe className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Global Verification</CardTitle>
                      <CardDescription>Verify anywhere, anytime</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Network Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-success">Live</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verification Speed</span>
                      <span className="text-sm font-medium">&lt; 3 seconds</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Security Level</span>
                      <div className="flex items-center space-x-1">
                        <Lock className="h-3 w-3 text-primary" />
                        <span className="text-sm font-medium">Enterprise</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Secure Your Certificates?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join educational institutions and organizations worldwide who trust 
              Hedera CertChain for secure, verifiable credentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                asChild 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
              >
                <a href="/auth">
                  Start Issuing Certificates
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
              >
                <a href="/verify">
                  Verify a Certificate
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* System Status Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">System Status</h2>
            <p className="text-lg text-muted-foreground">
              Real-time status of all Hedera CertChain components
            </p>
          </motion.div>
          <SystemStatus />
        </div>
      </section>
    </div>
  );
};

export default LandingPage;