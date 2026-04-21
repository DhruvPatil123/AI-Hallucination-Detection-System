import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS Headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user from the authorization header
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { text, domain, threshold } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
         throw new Error("GEMINI_API_KEY is not set in Edge Function secrets.");
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `You are an expert fact-checker and hallucination detection system.
Analyze the following AI-generated text for hallucinations.
Domain context: ${domain || 'general'}

Text to analyze:
"""
${text}
"""

For each hallucinated span, provide:
- start_offset: exact character offset (0-indexed) where the hallucination begins in the original text.
- end_offset: exact character offset where the hallucination ends.
- flagged_text: the exact hallucinated substring from the original text.
- category: must be exactly one of [factual, citation, logical, numerical, temporal].
- confidence: a float between 0.0 and 1.0 indicating your confidence that this is a hallucination.
- evidence: a brief explanation of why this is hallucinated or factually incorrect.

Return ONLY a valid JSON object in this exact format (do not include markdown block markers):
{
  "hallucination_score": <float between 0.0 and 1.0 indicating overall hallucination severity>,
  "risk_level": "<low | medium | high | critical>",
  "flagged_spans": [
    {
      "start_offset": <int>,
      "end_offset": <int>,
      "flagged_text": "<string>",
      "category": "<string>",
      "confidence": <float>,
      "evidence": "<string>"
    }
  ]
}`;

    const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                response_mime_type: "application/json"
            }
        })
    });

    if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const resultText = geminiData.candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(resultText);

    const processingTime = Date.now() - startTime;
    const requestId = crypto.randomUUID();

    // 1. Insert into verifications
    const { data: verificationData, error: vError } = await supabaseClient
        .from('verifications')
        .insert({
            user_id: user.id,
            input_text: text,
            domain: domain || 'general',
            hallucination_score: resultJson.hallucination_score,
            risk_level: resultJson.risk_level,
            processing_time_ms: processingTime,
            model_version: 'gemini-2.0-flash',
            threshold: threshold || 0.4,
            span_count: resultJson.flagged_spans.length,
            raw_response: resultJson
        })
        .select('id')
        .single();

    if (vError) throw vError;

    // 2. Insert flagged spans
    let insertedSpans = [];
    if (resultJson.flagged_spans && resultJson.flagged_spans.length > 0) {
        const spanInserts = resultJson.flagged_spans.map((span, idx) => ({
            verification_id: verificationData.id,
            user_id: user.id,
            span_index: idx,
            start_offset: span.start_offset,
            end_offset: span.end_offset,
            flagged_text: span.flagged_text,
            category: span.category,
            confidence: span.confidence,
            evidence: span.evidence
        }));

        const { data: spansData, error: sError } = await supabaseClient
            .from('flagged_spans')
            .insert(spanInserts)
            .select();

        if (sError) throw sError;
        insertedSpans = spansData;
    }

    // 3. Insert into audit_logs
    const primaryCategory = resultJson.flagged_spans.length > 0 
        ? resultJson.flagged_spans.sort((a,b) => b.confidence - a.confidence)[0].category 
        : null;

    const { error: aError } = await supabaseClient
        .from('audit_logs')
        .insert({
            user_id: user.id,
            verification_id: verificationData.id,
            model_id: 'gemini-2.0-flash',
            hallucination_score: resultJson.hallucination_score,
            risk_level: resultJson.risk_level,
            primary_category: primaryCategory,
            span_count: resultJson.flagged_spans.length,
            processing_time_ms: processingTime,
            domain: domain || 'general'
        });
        
    if (aError) console.error("Failed to insert audit log:", aError);

    // Return the response to the client
    return new Response(
      JSON.stringify({
          request_id: requestId,
          verification_id: verificationData.id,
          hallucination_score: resultJson.hallucination_score,
          risk_level: resultJson.risk_level,
          flagged_spans: insertedSpans,
          processing_time_ms: processingTime,
          model_version: 'gemini-2.0-flash'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
