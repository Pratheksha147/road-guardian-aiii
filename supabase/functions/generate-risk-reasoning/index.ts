import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskInput {
  zoneName: string;
  riskScore: number;
  riskLevel: string;
  factors: {
    baseRisk: number;
    weatherMultiplier: number;
    trafficMultiplier: number;
    timeMultiplier: number;
  };
  zoneFeatures: string[];
  weather: string;
  traffic: string;
  timeOfDay: string;
  distance: number;
  speed: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { riskInput }: { riskInput: RiskInput } = await req.json();
    console.log("Generating risk reasoning for:", riskInput.zoneName);

    const systemPrompt = `You are SafeZone AI, a road safety assistant that provides clear, concise, and actionable safety warnings to drivers. Your role is to:

1. Explain WHY a road zone is dangerous in simple, urgent terms
2. Provide personalized safety recommendations based on current conditions
3. Keep responses brief but impactful - drivers need quick, scannable information
4. Use a calm but authoritative tone that conveys urgency without causing panic

Format your response as JSON with these exact fields:
{
  "explanation": "A 1-2 sentence explanation of why this zone is dangerous right now",
  "primaryRisk": "The single most critical risk factor",
  "recommendations": ["Array of 2-3 specific actionable recommendations"],
  "safeSpeed": "Recommended safe speed for this zone",
  "alertLevel": "The urgency level: CAUTION, WARNING, or DANGER"
}`;

    const userPrompt = `Analyze this road zone and provide safety guidance:

Zone: ${riskInput.zoneName}
Risk Score: ${riskInput.riskScore}/100 (${riskInput.riskLevel})
Distance: ${riskInput.distance}m ahead
Current Speed: ${riskInput.speed} km/h

Zone Features: ${riskInput.zoneFeatures.join(', ')}
Weather: ${riskInput.weather}
Traffic: ${riskInput.traffic}
Time: ${riskInput.timeOfDay}

Risk Breakdown:
- Base road risk: ${riskInput.factors.baseRisk}
- Weather impact: ${riskInput.factors.weatherMultiplier}x
- Traffic impact: ${riskInput.factors.trafficMultiplier}x  
- Time-of-day impact: ${riskInput.factors.timeMultiplier}x

Provide a safety analysis and recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again shortly.",
          fallback: true 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits depleted. Using fallback reasoning.",
          fallback: true 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response received:", content?.substring(0, 100));

    // Parse the JSON response from AI
    let reasoning;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reasoning = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide structured fallback
      reasoning = {
        explanation: `Approaching ${riskInput.zoneName} with ${riskInput.riskLevel} risk due to ${riskInput.zoneFeatures[0] || 'road conditions'}.`,
        primaryRisk: riskInput.zoneFeatures[0] || "Variable road conditions",
        recommendations: [
          "Reduce speed before entering zone",
          "Stay alert and maintain safe following distance",
          "Be prepared to brake if needed"
        ],
        safeSpeed: riskInput.riskScore > 70 ? "30 km/h" : riskInput.riskScore > 50 ? "40 km/h" : "50 km/h",
        alertLevel: riskInput.riskLevel === "critical" ? "DANGER" : riskInput.riskLevel === "high" ? "WARNING" : "CAUTION"
      };
    }

    return new Response(JSON.stringify({ reasoning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-risk-reasoning:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
