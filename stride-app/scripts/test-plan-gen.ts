import { generatePersonalizedPlan } from '../src/lib/gemini';
import { generatePlanFromTemplate, getPlanTemplate } from '../src/lib/plan-templates';

async function testPlanGen() {
    console.log('🧪 Testing AI Plan Generation...');

    const mockProfile = {
        distanceType: 'half',
        userProfile: {
            experience_level: 'beginner',
            age: 30,
            gender: 'male',
            height_cm: 180,
            weight_kg: 75,
            running_history_months: 2,
            current_weekly_km: 10
        }
    };

    try {
        console.log('Using Mock AI Response...');
        const aiResponse = {
            coachingPhilosophy: "You are doing great! Focus on consistency and enjoy the journey.",
            suggestedAdjustments: "Reduced Tuesday volume to account for your current low weekly mileage.",
            weeklyNotes: [
                "Focus on breathing and easy effort this week.",
                "Slightly longer Tuesday session; listen to your knees.",
                "Steady progress. Keep it conversational.",
                "Ready for building next week!"
            ]
        };
        console.log('✅ Mock response prepared:', JSON.stringify(aiResponse, null, 2));

        const template = getPlanTemplate('half', 'beginner');
        const finalPlan = generatePlanFromTemplate(template, new Date(), aiResponse);

        console.log('✅ Final Plan generated with AI notes for Week 1:');
        console.log(JSON.stringify(finalPlan[0].sessions[0].prescribedWorkout.notes, null, 2));

        if (finalPlan[0].aiAdjustments) {
            console.log('✅ Plan includes AI adjustments Summary');
        } else {
            console.warn('⚠️ Plan missing AI adjustments field');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testPlanGen();
