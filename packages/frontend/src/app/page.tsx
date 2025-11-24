'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowRight, Cpu, Zap, Shield, Cloud } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Design',
    description: 'Let AI assist you in creating complex CAD models with natural language commands.',
    icon: Cpu,
  },
  {
    name: 'Lightning Fast',
    description: 'Optimized 3D rendering engine delivers smooth performance on any device.',
    icon: Zap,
  },
  {
    name: 'Enterprise Security',
    description: 'Your designs are protected with end-to-end encryption and secure cloud storage.',
    icon: Shield,
  },
  {
    name: 'Cloud Native',
    description: 'Access your projects from anywhere. Collaborate in real-time with your team.',
    icon: Cloud,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 lg:pt-32 lg:pb-24">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
            Design the Future with
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered CAD
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            The autonomous CAD engine that understands your vision. Create, iterate, and collaborate on 3D designs faster than ever.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything you need to design
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of engineers using CAD Engine to build the future.
          </p>
          <Button size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="/signup">
              Create Free Account
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} CAD Autonomous Engine. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
