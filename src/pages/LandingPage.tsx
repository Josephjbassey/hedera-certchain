import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, CheckCircle, QrCode, Lock, Zap, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Landing Page - Hedera Certificate Verification System
 * 
 * Professional, trustworthy landing page with forest green branding (#164734)
 * Designed to convince institutions to use the platform and allow public verification
 */
export const LandingPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Blockchain-Secured Credentials</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Issue Verifiable
                <span className="block text-primary mt-2">
                  Certificates on Blockchain
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                Fraud-proof credentials verified instantly on Hedera. Empower your institution with tamper-proof, blockchain-based certificate issuance.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                  asChild
                >
                  <a href="/setup">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                  asChild
                >
                  <a href="/verify">
                    Verify Certificate
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-8 border-t border-border">
                <div className="flex flex-col">
                  <div className="text-3xl font-bold text-foreground">1000+</div>
                  <div className="text-sm text-muted-foreground">Certificates Issued</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-3xl font-bold text-foreground">99.9%</div>
                  <div className="text-sm text-muted-foreground">Verification Success</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-3xl font-bold text-foreground">50+</div>
                  <div className="text-sm text-muted-foreground">Institutions</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary" />
                
                {/* Content Overlay */}
                <div className="relative p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px]">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    {/* Shield Icon */}
                    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-2xl">
                      <Shield className="h-32 w-32 text-white" strokeWidth={1.5} />
                    </div>
                    
                    {/* Floating QR Code */}
                    <motion.div
                      animate={{
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute -top-8 -right-8 bg-white p-4 rounded-lg shadow-xl"
                    >
                      <QrCode className="h-12 w-12 text-primary" />
                    </motion.div>
                    
                    {/* Floating Checkmark */}
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="absolute -bottom-6 -left-6 bg-secondary/90 p-3 rounded-full shadow-xl"
                    >
                      <CheckCircle className="h-8 w-8 text-white" />
                    </motion.div>
                  </motion.div>

                  <p className="mt-12 text-white/90 text-center font-medium">
                    Powered by Hedera Hashgraph
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              Key Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for <span className="text-primary">Secure Credentials</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on blockchain technology to ensure authenticity, security, and instant verification
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Verification",
                description: "Verify any certificate in seconds with QR code or ID. No waiting, no hassle.",
                color: "text-secondary"
              },
              {
                icon: Lock,
                title: "Blockchain Security",
                description: "Tamper-proof certificates stored permanently on Hedera for immutable records.",
                color: "text-primary"
              },
              {
                icon: Users,
                title: "Easy Integration",
                description: "Simple dashboard for issuing certificates in bulk. No technical expertise required.",
                color: "text-accent"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Social Proof Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Award, metric: "1000+", label: "Certificates Issued", subtext: "And growing daily" },
              { icon: CheckCircle, metric: "99.9%", label: "Verification Success", subtext: "Instant validation" },
              { icon: TrendingUp, metric: "50+", label: "Active Institutions", subtext: "Worldwide trust" }
            ].map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                <Card className="border-border">
                  <CardContent className="pt-12 pb-8">
                    <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-5xl font-bold mb-2 text-foreground">{stat.metric}</div>
                    <div className="text-lg font-semibold mb-1">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.subtext}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-secondary" />
            <div className="relative px-8 md:px-16 py-16 md:py-24 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Secure Your Certificates?</h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">Join institutions worldwide using blockchain technology for tamper-proof credentials</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-xl" asChild>
                  <a href="/setup">Get Started Now<ArrowRight className="ml-2 h-5 w-5" /></a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-white/5" asChild>
                  <a href="/verify">Verify a Certificate</a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;