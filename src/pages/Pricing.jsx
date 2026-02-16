import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const navigate = useNavigate();

    const plans = [
        {
            name: 'STARTER',
            price: billingCycle === 'monthly' ? 29 : 290,
            description: 'Perfect for small clinics getting started',
            features: [
                '1 Clinic Location',
                '1 Doctor',
                'Up to 2 Staff Members',
                'Appointments & Scheduling',
                'Prescriptions Management',
                'Basic Billing',
                'Patient Records',
                'Web + Mobile Access',
                '14-Day Free Trial'
            ],
            cta: 'Start Free Trial',
            popular: false
        },
        {
            name: 'GROWTH',
            price: billingCycle === 'monthly' ? 59 : 590,
            description: 'For growing practices with multiple doctors',
            features: [
                '1 Clinic Location',
                'Up to 5 Doctors',
                'Up to 15 Staff Members',
                'Advanced Scheduling',
                'Prescriptions & Inventory',
                'Full Billing Suite',
                'Patient Records & History',
                'Reports & Analytics',
                'Web + Mobile Access',
                '14-Day Free Trial'
            ],
            cta: 'Start Free Trial',
            popular: true
        },
        {
            name: 'PRO',
            price: billingCycle === 'monthly' ? 129 : 1290,
            description: 'Enterprise solution for multi-clinic operations',
            features: [
                'Unlimited Clinic Locations',
                'Unlimited Doctors',
                'Unlimited Staff',
                'Multi-Clinic Management',
                'Advanced Scheduling',
                'Full Billing & Inventory',
                'Comprehensive Reports',
                'Audit Logs',
                'API Access',
                'Priority Support',
                'Web + Mobile Access',
                '14-Day Free Trial'
            ],
            cta: 'Start Free Trial',
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        Clinic Central
                    </Link>
                    <div className="flex gap-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/signup"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Choose the perfect plan for your clinic. All plans include web and mobile access.
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full transition ${billingCycle === 'monthly'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:text-blue-600'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full transition flex items-center gap-2 ${billingCycle === 'yearly'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:text-blue-600'
                            }`}
                    >
                        Yearly
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            Save 2 months
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${plan.popular ? 'ring-4 ring-blue-500' : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-600 mb-6 h-12">{plan.description}</p>

                                <div className="mb-6">
                                    <span className="text-5xl font-bold text-gray-900">
                                        ${plan.price}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => navigate('/signup')}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold transition ${plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {plan.cta}
                                </button>

                                <div className="mt-8 space-y-4">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Web + Mobile Badge */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-4 border-t border-gray-100">
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700">
                                    <Zap className="w-4 h-4 text-blue-600" />
                                    Web + Mobile Included
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            What happens after the 14-day trial?
                        </h3>
                        <p className="text-gray-600">
                            After your trial ends, you'll need to choose a paid plan to continue using the service. Your data will be preserved, and you can upgrade at any time.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            Can I change plans later?
                        </h3>
                        <p className="text-gray-600">
                            Yes! You can upgrade or downgrade your plan at any time from your billing settings. Changes take effect immediately.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            Is my data secure?
                        </h3>
                        <p className="text-gray-600">
                            Absolutely. We use industry-standard encryption and security practices to protect your clinic's data. All plans include secure data storage and regular backups.
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            Do you offer refunds?
                        </h3>
                        <p className="text-gray-600">
                            We do not offer refunds. However, you can cancel your subscription at any time, and you'll retain access until the end of your billing period.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400">
                        © 2026 Clinic Central. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
