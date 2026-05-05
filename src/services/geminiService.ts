import { GoogleGenAI } from "@google/genai";
import { WeatherData, ClimateData, getWeatherDescription } from "./weatherService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateWeatherBriefing = async (weather: WeatherData, location: string): Promise<string> => {
  const currentDesc = getWeatherDescription(weather.current.weatherCode);
  const forecastSummary = weather.daily.time.map((time, i) => 
    `${time}: ${getWeatherDescription(weather.daily.weatherCode[i])}, Max: ${weather.daily.tempMax[i]}°C, Min: ${weather.daily.tempMin[i]}°C`
  ).join('\n');

  const prompt = `
    You are a professional meteorological AI assistant. Provide a personalized, hyper-local weather briefing for ${location}.
    
    Current Conditions:
    - Temperature: ${weather.current.temp}°C (Feels like ${weather.current.apparentTemp}°C)
    - Condition: ${currentDesc}
    - Humidity: ${weather.current.humidity}%
    - Wind Speed: ${weather.current.windSpeed} km/h
    
    Next 7 Days Forecast:
    ${forecastSummary}
    
    Guidelines:
    1. Be concise but insightful.
    2. Suggest appropriate clothing and activities.
    3. Note any interesting patterns or potential severe weather.
    4. Keep the tone professional yet approachable.
    5. Use markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Unable to generate briefing at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI weather advisor is currently offline.";
  }
};

export const analyzeClimateTrends = async (climate: ClimateData, location: string): Promise<string> => {
  const years = climate.years.join(', ');
  const temps = climate.avgTemp.join(', ');
  
  const prompt = `
    Analyze these 10-year climate trends for ${location}:
    Years: ${years}
    Average Yearly Temperatures (°C): ${temps}
    
    Briefly explain:
    1. If there's a clear warming or cooling trend.
    2. What these long-term changes mean for local residents.
    3. Future outlook based on these observations.
    
    Keep it to 2-3 paragraphs. Use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Climate analysis unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Climate analysis service encountered an error.";
  }
};

export const chatWithWeatherAI = async (
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  weather: WeatherData,
  location: string
): Promise<string> => {
  const currentDesc = getWeatherDescription(weather.current.weatherCode);
  
  const systemContext = `
    You are the "Nimbus AI" weather assistant. You are chatting with a user in ${location}.
    Current weather: ${weather.current.temp}°C, ${currentDesc}.
    
    Always be helpful, scientific, and professional. Use current local weather data to inform your answers. 
    If asked about activities, suggest ones that fit the current ${currentDesc} conditions.
    Keep responses concise and formatted with markdown.
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: [
        { role: 'user', parts: [{ text: `System Context: ${systemContext}` }] },
        { role: 'model', parts: [{ text: "Understood. I am Nimbus AI, your meteorological assistant. How can I help you today?" }] },
        ...history
      ],
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm having trouble processing that.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to my atmospheric processing cores. Please try again in a moment.";
  }
};
