import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getSubscriptionDetails } from '../middleware/subscription.js';

const router = express.Router();

// GET /subscription
router.get('/subscription', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const subscriptionDetails = await getSubscriptionDetails(clinicId);
        if (!subscriptionDetails) return res.status(404).json({ message: 'No subscription found for this clinic' });

        const doctorCount = await prisma.clinicUser.count({
            where: { clinicId, role: { name: 'DOCTOR' } }
        });
        const totalStaff = await prisma.clinicUser.count({
            where: { clinicId, role: { name: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }
        });

        res.json({
            subscription: {
                id: subscriptionDetails.id, status: subscriptionDetails.status,
                planName: subscriptionDetails.planName,
                priceMonthly: subscriptionDetails.priceMonthly, priceYearly: subscriptionDetails.priceYearly,
                trialEndsAt: subscriptionDetails.trialEndsAt, trialDaysLeft: subscriptionDetails.trialDaysLeft,
                startsAt: subscriptionDetails.startsAt, endsAt: subscriptionDetails.endsAt
            },
            plan: {
                name: subscriptionDetails.planName,
                maxDoctors: subscriptionDetails.maxDoctors, maxStaff: subscriptionDetails.maxStaff,
                multiClinic: subscriptionDetails.multiClinic,
                features: subscriptionDetails.features
            },
            usage: { doctors: doctorCount, totalStaff, maxDoctors: subscriptionDetails.maxDoctors, maxStaff: subscriptionDetails.maxStaff }
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
        const formattedPlans = plans.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : []
        }));
        res.json({ plans: formattedPlans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /upgrade
router.post('/upgrade', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const { planName, billingCycle } = req.body;
        if (!planName || !billingCycle) return res.status(400).json({ message: 'Plan name and billing cycle are required' });
        if (!['monthly', 'yearly'].includes(billingCycle)) return res.status(400).json({ message: 'Billing cycle must be monthly or yearly' });

        const newPlan = await prisma.plan.findUnique({ where: { name: planName } });
        if (!newPlan) return res.status(404).json({ message: 'Plan not found' });

        const currentSubscription = await prisma.subscription.findUnique({ where: { clinicId } });
        if (!currentSubscription) return res.status(404).json({ message: 'No subscription found' });

        const currentPlan = await prisma.plan.findUnique({ where: { id: currentSubscription.planId } });
        if (newPlan.priceMonthly <= currentPlan.priceMonthly) return res.status(400).json({ message: 'Use the downgrade endpoint to switch to a lower plan' });

        console.log(`[MOCK PAYMENT] Processing upgrade for clinic ${clinicId} to ${planName} (${billingCycle})`);

        await prisma.subscription.update({
            where: { clinicId },
            data: { planId: newPlan.id, status: 'active', trialEndsAt: null }
        });

        const updatedSubscription = await getSubscriptionDetails(clinicId);
        res.json({ message: 'Subscription upgraded successfully', subscription: updatedSubscription });
    } catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /downgrade
router.post('/downgrade', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const { planName } = req.body;
        if (!planName) return res.status(400).json({ message: 'Plan name is required' });

        const newPlan = await prisma.plan.findUnique({ where: { name: planName } });
        if (!newPlan) return res.status(404).json({ message: 'Plan not found' });

        const currentSubscription = await prisma.subscription.findUnique({ where: { clinicId } });
        if (!currentSubscription) return res.status(404).json({ message: 'No subscription found' });

        const currentPlan = await prisma.plan.findUnique({ where: { id: currentSubscription.planId } });
        if (newPlan.priceMonthly >= currentPlan.priceMonthly) return res.status(400).json({ message: 'Use the upgrade endpoint to switch to a higher plan' });

        const doctorCount = await prisma.clinicUser.count({ where: { clinicId, role: { name: 'DOCTOR' } } });
        const totalStaff = await prisma.clinicUser.count({ where: { clinicId, role: { name: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } } });

        if (newPlan.maxDoctors !== null && doctorCount > newPlan.maxDoctors) {
            return res.status(400).json({ message: `Cannot downgrade: You have ${doctorCount} doctor(s) but the ${planName} plan allows only ${newPlan.maxDoctors}`, currentDoctors: doctorCount, planLimit: newPlan.maxDoctors });
        }
        if (newPlan.maxStaff !== null && totalStaff > newPlan.maxStaff) {
            return res.status(400).json({ message: `Cannot downgrade: You have ${totalStaff} staff member(s) but the ${planName} plan allows only ${newPlan.maxStaff}`, currentStaff: totalStaff, planLimit: newPlan.maxStaff });
        }

        await prisma.subscription.update({ where: { clinicId }, data: { planId: newPlan.id } });
        const updatedSubscription = await getSubscriptionDetails(clinicId);
        res.json({ message: 'Subscription downgraded successfully', subscription: updatedSubscription });
    } catch (error) {
        console.error('Downgrade subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /cancel
router.post('/cancel', requireAuth, async (req, res) => {
    try {
        const clinicId = req.user.clinicId;
        const subscription = await prisma.subscription.findUnique({ where: { clinicId } });
        if (!subscription) return res.status(404).json({ message: 'No subscription found' });
        if (subscription.status === 'canceled') return res.status(400).json({ message: 'Subscription is already canceled' });
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);
        await prisma.subscription.update({ where: { clinicId }, data: { status: 'canceled', endsAt } });
        res.json({ message: 'Subscription canceled successfully. Access will continue until the end of your billing period.', endsAt: endsAt.toISOString() });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
