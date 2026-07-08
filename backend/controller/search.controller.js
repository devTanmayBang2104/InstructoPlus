import Course from "../model/course.Model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
export const searchWithAi= async(req,res)=>{
  try {
    const{input}= req.body;
    if(!input){
      return res.status(400).json({
        success:false,
        message:"Input is required"
      })
    }

    // Define a list of fallback keywords that might match common queries
    const fallbackKeywords = [
      "Web Development",
      "Data Science",
      "Beginner",
      "AI/ML"
    ];

    let keyword = "";

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,

      });
      const prompt = `you are an intelligent assistant for InstructoPlus platform. A user will type any query about what they want to learn. You task is to understand the intent and return one **most relevent keyword** from the following list of course categeroy and levels:
      1. Beginner
      2. Intermediate
      3. Advanced
      4. Data Science
      5. Web Development
      6. App Development
      7. Ethical Hacking
      8. Data Analytics
      9. AI/ML
      10. AI Tools
      11. UI/UX Design
      12. Web Development
      only reply with one single keyword from the list above that best match the query . do not explain anything.No extra text.
`;

      // Use the GoogleGenAI instance with models.generateContent
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: input + "\n" + prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100,
        }
      });

      keyword = response.candidates[0].content.parts[0].text.trim();
      // console.log("Generated keyword:", keyword);
    } catch (aiError) {
      console.error("Error with Gemini API:", aiError);
      // If the API call fails, use the input itself as the keyword or a random fallback keyword
      const randomIndex = Math.floor(Math.random() * fallbackKeywords.length);
      keyword = input || fallbackKeywords[randomIndex];
      console.log("Using fallback keyword:", keyword);
    }
    // First try searching with the user's input
    const courses = await Course.find({
      isPublished: true,
      $or: [{
        title: { $regex: input, $options: "i" }
      },
      {
        subTitle: { $regex: input, $options: "i" }
      },
      {
        level: { $regex: input, $options: "i" }
      },
      {
        category: { $regex: input, $options: "i" }
      },
      {
        description: { $regex: input, $options: "i" }
      }]
    });

    // If we found courses with the input, return them
    if (courses.length > 0) {
      return res.status(200).json(courses);
    }

    // Otherwise, try searching with the keyword (either from AI or fallback)
    const keywordCourses = await Course.find({
      isPublished: true,
      $or: [{
        title: { $regex: keyword, $options: "i" }
      },
      {
        subTitle: { $regex: keyword, $options: "i" }
      },
      {
        level: { $regex: keyword, $options: "i" }
      },
      {
        category: { $regex: keyword, $options: "i" }
      },
      {
        description: { $regex: keyword, $options: "i" }
      }]
    });

    return res.status(200).json(keywordCourses);
  } catch (error) {
    console.error("Error in database search:", error);
    return res.status(500).json({
      success: false,
      message: "Error while searching courses",
      error: error.message
    });
  }
}
