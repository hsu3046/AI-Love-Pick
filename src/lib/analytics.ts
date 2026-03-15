import { supabase } from './supabase';
import type { QuizResult } from '../engine/scoring';

/** Session-unique ID to prevent duplicate submissions */
const sessionId = crypto.randomUUID();
let submitted = false;

/**
 * Submit quiz result to Supabase for anonymous analytics.
 * Silent failure — never blocks the user experience.
 */
export async function submitQuizResult(
  answers: Map<number, string>,
  result: QuizResult,
): Promise<void> {
  if (submitted || !supabase) return;
  submitted = true;

  try {
    const { scores, practical, type, reasonings } = result;

    const row = {
      session_id: sessionId,
      // Phase 1 answers (Q1–Q6)
      q1_answer: answers.get(1) ?? null,
      q2_answer: answers.get(2) ?? null,
      q3_answer: answers.get(3) ?? null,
      q4_answer: answers.get(4) ?? null,
      q5_answer: answers.get(5) ?? null,
      q6_answer: answers.get(6) ?? null,
      // Phase 2 answers (Q7–Q12)
      q7_answer: practical.usageNeeds.size > 0 ? Array.from(practical.usageNeeds).join(',') : null,
      q8_answer: answers.get(8) ?? null,
      q9_answer: answers.get(9) ?? null,
      q10_answer: answers.get(10) ?? null,
      q11_answer: answers.get(11) ?? null,
      q12_answer: answers.get(12) ?? null,
      // 4-axis scores
      score_speed_depth: scores.speed_depth,
      score_real_creative: scores.real_creative,
      score_logic_visual: scores.logic_visual,
      score_plan_flow: scores.plan_flow,
      // Result
      result_type_id: type.id,
      result_type_name: type.name,
      main_llm: reasonings[0]?.serviceKey ?? type.mainLLM,
      recommended_tier: result.recommendedTier,
      // Practical profile
      usage_needs: Array.from(practical.usageNeeds),
      frequency: practical.frequency,
      priority: practical.priority,
      experience: practical.experience,
      budget_krw: practical.budgetKRW,
      // Metadata (anonymous)
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      locale: navigator.language,
    };

    const { error } = await supabase.from('ailovepick_quiz_submissions').insert(row);
    if (error) {
      console.warn('[Analytics] Submit failed:', error.message);
      submitted = false; // Allow retry
    }
  } catch (err) {
    console.warn('[Analytics] Unexpected error:', err);
    submitted = false;
  }
}

// ─── Event Tracking ─────────────────────────────────────────

/**
 * Track a generic event. Silent failure.
 */
export function trackEvent(
  event: string,
  data?: { screen?: string; result_type_id?: string; metadata?: Record<string, unknown> },
): void {
  if (!supabase) return;
  supabase.from('ailovepick_events').insert({
    session_id: sessionId,
    event,
    screen: data?.screen ?? null,
    result_type_id: data?.result_type_id ?? null,
    metadata: data?.metadata ?? null,
  }).then(({ error }) => {
    if (error) console.warn('[Analytics] Event failed:', error.message);
  });
}

/**
 * Track screen view for funnel analysis.
 */
export function trackScreenView(screen: string): void {
  trackEvent('screen_view', { screen });
}

/**
 * Track share button click.
 */
export function trackShareClick(resultTypeId: string): void {
  trackEvent('share_click', { result_type_id: resultTypeId });
}

/**
 * Initialize dwell time tracking.
 * Sends session_end event with duration on page unload.
 */
export function initDwellTracking(): void {
  if (!supabase) return;
  const enterTime = Date.now();

  const sendDwell = (): void => {
    const duration = Math.floor((Date.now() - enterTime) / 1000);
    if (duration < 2) return; // Ignore bounces under 2s

    // Use fetch with keepalive for reliable delivery on page unload
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/ailovepick_events`;
    const body = JSON.stringify({
      session_id: sessionId,
      event: 'session_end',
      duration_seconds: duration,
    });
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body,
      keepalive: true,
    }).catch(() => {});
  };

  window.addEventListener('beforeunload', sendDwell);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendDwell();
  });
}
