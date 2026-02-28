import prisma from '../db.js';

// Middleware: require active subscription
export async function requireActiveSubscription(req, res, next) {
    try {
        const clinicId = req.user.clinicId;
        if (!clinicId) return res.status(400).json({ message: 'No clinic context found' });

        const subscription = await prisma.subscription.findUnique({
            where: { clinicId },
            include: { plan: true }
        });

        if (!subscription) return res.status(403).json({ message: 'No active subscription found', requiresUpgrade: true });

        if (subscription.status === 'canceled' || subscription.status === 'past_due') {
            return res.status(403).json({ message: 'Your subscription is not active. Please update your billing information.', status: subscription.status, requiresUpgrade: true });
        }

        if (subscription.status === 'trialing' && subscription.trialEndsAt) {
            const trialEnd = new Date(subscription.trialEndsAt);
            if (new Date() > trialEnd) {
                await prisma.subscription.update({ where: { id: subscription.id }, data: { status: 'past_due' } });
                return res.status(403).json({ message: 'Your trial has expired. Please upgrade to continue.', requiresUpgrade: true, trialExpired: true });
            }
        }

        req.subscription = { ...subscription, planName: subscription.plan.name };
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Middleware factory: require plan feature
export function requirePlanFeature(feature) {
    return async (req, res, next) => {
        try {
            const clinicId = req.user.clinicId;
            const subscription = await prisma.subscription.findUnique({
                where: { clinicId },
                include: { plan: { select: { features: true, name: true } } }
            });
            if (!subscription) return res.status(403).json({ message: 'No subscription found', requiresUpgrade: true });
            const features = subscription.plan.features ? JSON.parse(subscription.plan.features) : [];
            if (!features.includes(feature)) {
                return res.status(403).json({ message: 'This feature requires a higher plan', feature, currentPlan: subscription.plan.name, requiresUpgrade: true });
            }
            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
}

// Middleware factory: check staff limits
export function checkStaffLimit(roleType) {
    return async (req, res, next) => {
        try {
            const clinicId = req.user.clinicId;
            const subscription = await prisma.subscription.findUnique({
                where: { clinicId },
                include: { plan: { select: { maxDoctors: true, maxStaff: true, name: true } } }
            });
            if (!subscription) return res.status(403).json({ message: 'No subscription found', requiresUpgrade: true });

            const role = await prisma.role.findUnique({ where: { name: roleType } });
            if (!role) return res.status(400).json({ message: 'Invalid role type' });

            const currentCount = await prisma.clinicUser.count({ where: { clinicId, roleId: role.id } });

            if (roleType === 'DOCTOR' && subscription.plan.maxDoctors !== null) {
                if (currentCount >= subscription.plan.maxDoctors) {
                    return res.status(403).json({
                        message: `Your ${subscription.plan.name} plan allows up to ${subscription.plan.maxDoctors} doctor(s). Please upgrade to add more.`,
                        currentCount, limit: subscription.plan.maxDoctors, requiresUpgrade: true
                    });
                }
            } else if (subscription.plan.maxStaff !== null) {
                const totalStaff = await prisma.clinicUser.count({
                    where: { clinicId, role: { name: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }
                });
                if (totalStaff >= subscription.plan.maxStaff) {
                    return res.status(403).json({
                        message: `Your ${subscription.plan.name} plan allows up to ${subscription.plan.maxStaff} staff member(s). Please upgrade to add more.`,
                        currentCount: totalStaff, limit: subscription.plan.maxStaff, requiresUpgrade: true
                    });
                }
            }
            next();
        } catch (error) {
            console.error('Staff limit check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
}

// Helper: get subscription details (async)
export async function getSubscriptionDetails(clinicId) {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { clinicId },
            include: { plan: true }
        });
        if (!subscription) return null;
        let trialDaysLeft = null;
        if (subscription.status === 'trialing' && subscription.trialEndsAt) {
            const trialEnd = new Date(subscription.trialEndsAt);
            const diffTime = trialEnd - new Date();
            trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (trialDaysLeft < 0) trialDaysLeft = 0;
        }
        return {
            ...subscription,
            planName: subscription.plan.name,
            priceMonthly: subscription.plan.priceMonthly,
            priceYearly: subscription.plan.priceYearly,
            maxDoctors: subscription.plan.maxDoctors,
            maxStaff: subscription.plan.maxStaff,
            multiClinic: subscription.plan.multiClinic,
            features: subscription.plan.features ? JSON.parse(subscription.plan.features) : [],
            trialDaysLeft
        };
    } catch (error) {
        console.error('Get subscription details error:', error);
        return null;
    }
}
